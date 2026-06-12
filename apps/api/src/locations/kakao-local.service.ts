import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { geocodeCache } from '../database/schema';
import { and, eq } from 'drizzle-orm';

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  phone: string;
  place_url: string;
  distance: string;
}

interface KakaoKeywordResponse {
  documents: KakaoDocument[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export interface PlaceResult {
  placeId: string;
  placeName: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  phone: string;
  category: string;
  placeUrl: string;
  distance: string | null;
}

export interface PlaceSearchResponse {
  places: PlaceResult[];
  meta: {
    totalCount: number;
    pageableCount: number;
    isEnd: boolean;
  };
}

@Injectable()
export class KakaoLocalService {
  private readonly logger = new Logger(KakaoLocalService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://dapi.kakao.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('KAKAO_REST_API_KEY');
  }

  async searchByKeyword(
    query: string,
    page: number,
    size: number,
  ): Promise<PlaceSearchResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<KakaoKeywordResponse>(
          `${this.baseUrl}/v2/local/search/keyword.json`,
          {
            headers: { Authorization: `KakaoAK ${this.apiKey}` },
            params: { query, page, size },
          },
        ),
      );

      return {
        places: data.documents.map(this.mapDocument),
        meta: {
          totalCount: data.meta.total_count,
          pageableCount: data.meta.pageable_count,
          isEnd: data.meta.is_end,
        },
      };
    } catch {
      throw new InternalServerErrorException('KAKAO_API_ERROR');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const latKey = lat.toFixed(3);
    const lngKey = lng.toFixed(3);

    // DB 캐시 조회
    const [cached] = await this.db
      .select()
      .from(geocodeCache)
      .where(and(eq(geocodeCache.latKey, latKey), eq(geocodeCache.lngKey, lngKey)))
      .limit(1);
    if (cached) return cached.address; // null이어도 캐시 hit (주소 없는 지역)

    // Kakao coord2address 호출 (원본 좌표 — 반올림은 캐시 키 전용)
    interface KakaoCoord2AddressResponse {
      documents?: Array<{
        address?: {
          region_1depth_name?: string;
          region_2depth_name?: string;
          region_3depth_name?: string;
        };
      }>;
    }
    const res = await firstValueFrom(
      this.httpService.get<KakaoCoord2AddressResponse>(
        `${this.baseUrl}/v2/local/geo/coord2address.json`,
        {
          headers: { Authorization: `KakaoAK ${this.apiKey}` },
          params: { x: lng, y: lat },
        },
      ),
    ).catch((err: unknown) => {
      this.logger.warn(
        `Kakao reverseGeocode failed lat=${lat} lng=${lng}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    });

    const addr = res?.data?.documents?.[0]?.address;
    const address = addr
      ? [addr.region_1depth_name, addr.region_2depth_name, addr.region_3depth_name]
          .filter(Boolean)
          .join(' ') || null
      : null;

    await this.db
      .insert(geocodeCache)
      .values({ latKey, lngKey, address })
      .onConflictDoNothing();

    return address;
  }

  private mapDocument(doc: KakaoDocument): PlaceResult {
    return {
      placeId: doc.id,
      placeName: doc.place_name,
      address: doc.address_name,
      roadAddress: doc.road_address_name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      phone: doc.phone,
      category: doc.category_name,
      placeUrl: doc.place_url,
      distance: doc.distance || null,
    };
  }
}
