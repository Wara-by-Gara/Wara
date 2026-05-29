import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { KakaoLocalService } from './kakao-local.service';

const mockHttpService = { get: jest.fn() };
const mockConfigService = { getOrThrow: jest.fn().mockReturnValue('test-api-key') };

const kakaoDoc = {
  id: '123',
  place_name: '강남역',
  category_name: '지하철역',
  address_name: '서울 강남구',
  road_address_name: '서울 강남구 테헤란로',
  x: '127.027',
  y: '37.497',
  phone: '02-1234-5678',
  place_url: 'https://place.url',
  distance: '100',
};

describe('KakaoLocalService', () => {
  let service: KakaoLocalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KakaoLocalService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(KakaoLocalService);
    jest.clearAllMocks();
  });

  describe('searchByKeyword', () => {
    it('카카오 응답을 camelCase로 매핑', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            documents: [kakaoDoc],
            meta: { total_count: 1, pageable_count: 1, is_end: true },
          },
        }),
      );

      const result = await service.searchByKeyword('강남역', 1, 15);

      expect(result.places).toHaveLength(1);
      const place = result.places[0]!;
      expect(place.placeId).toBe('123');
      expect(place.placeName).toBe('강남역');
      expect(place.lat).toBe(37.497);
      expect(place.lng).toBe(127.027);
      expect(place.address).toBe('서울 강남구');
      expect(place.roadAddress).toBe('서울 강남구 테헤란로');
      expect(place.distance).toBe('100');

      expect(result.meta).toEqual({ totalCount: 1, pageableCount: 1, isEnd: true });
    });

    it('distance 빈 string → null 변환', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            documents: [{ ...kakaoDoc, distance: '' }],
            meta: { total_count: 1, pageable_count: 1, is_end: false },
          },
        }),
      );

      const result = await service.searchByKeyword('강남역', 1, 15);

      expect(result.places[0]!.distance).toBeNull();
    });

    it('HTTP 오류 → InternalServerErrorException(KAKAO_API_ERROR)', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('network error')));

      await expect(service.searchByKeyword('강남역', 1, 15)).rejects.toThrow(
        new InternalServerErrorException('KAKAO_API_ERROR'),
      );
    });
  });
});
