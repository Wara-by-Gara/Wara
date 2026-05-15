import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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
  private readonly apiKey: string;
  private readonly baseUrl = 'https://dapi.kakao.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
