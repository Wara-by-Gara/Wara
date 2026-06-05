import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { withTimeout } from '../common/utils/with-timeout';

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

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간 — 장소 정보는 잘 안 변함
const CACHE_OP_TIMEOUT_MS = 500; // Redis 다운 시 빠르게 Kakao 직접 호출로 fallback

@Injectable()
export class KakaoLocalService {
  private readonly logger = new Logger(KakaoLocalService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://dapi.kakao.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('KAKAO_REST_API_KEY');
  }

  async searchByKeyword(
    query: string,
    page: number,
    size: number,
  ): Promise<PlaceSearchResponse> {
    const cacheKey = `place:keyword:${encodeURIComponent(query.trim())}:${page}:${size}`;

    const cached = await this.tryGetCache(cacheKey);
    if (cached) return cached;

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

      const response: PlaceSearchResponse = {
        places: data.documents.map(this.mapDocument),
        meta: {
          totalCount: data.meta.total_count,
          pageableCount: data.meta.pageable_count,
          isEnd: data.meta.is_end,
        },
      };

      await this.trySetCache(cacheKey, response);
      return response;
    } catch {
      throw new InternalServerErrorException('KAKAO_API_ERROR');
    }
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

  // Redis 장애 시 Kakao 직접 호출로 degrade — 캐시는 옵셔널 레이어.
  private async tryGetCache(key: string): Promise<PlaceSearchResponse | null> {
    try {
      const cached = await withTimeout(this.cache.get<PlaceSearchResponse>(key), CACHE_OP_TIMEOUT_MS);
      return cached ?? null;
    } catch (err) {
      this.logger.warn(`cache get 실패 (fallback): ${(err as Error).message}`);
      return null;
    }
  }

  private async trySetCache(key: string, value: PlaceSearchResponse): Promise<void> {
    try {
      await withTimeout(this.cache.set(key, value, CACHE_TTL_MS), CACHE_OP_TIMEOUT_MS);
    } catch (err) {
      this.logger.warn(`cache set 실패 (무시): ${(err as Error).message}`);
    }
  }
}
