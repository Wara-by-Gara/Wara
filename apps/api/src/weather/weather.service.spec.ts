import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WeatherService } from './weather.service';
import { WeatherRepository } from './weather.repository';
import { KmaWeatherClient } from './kma-weather.client';
import type { KmaForecastItem } from './kma-weather.client';

const FUTURE_24H = new Date(Date.now() + 24 * 60 * 60 * 1000);

const mockInvitation = {
  eventStartAt: FUTURE_24H,
  eventLocation: { lat: 37.5665, lng: 126.978 },
};

const mockForecastItems: KmaForecastItem[] = [
  { category: 'TMP', fcstDate: '20250616', fcstTime: '1200', fcstValue: '22' },
  { category: 'SKY', fcstDate: '20250616', fcstTime: '1200', fcstValue: '1' },
  { category: 'PTY', fcstDate: '20250616', fcstTime: '1200', fcstValue: '0' },
  { category: 'POP', fcstDate: '20250616', fcstTime: '1200', fcstValue: '10' },
];

describe('WeatherService', () => {
  let service: WeatherService;
  let repository: jest.Mocked<WeatherRepository>;
  let kmaClient: jest.Mocked<KmaWeatherClient>;
  let cache: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    repository = { findInvitationWithLocation: jest.fn() } as unknown as jest.Mocked<WeatherRepository>;
    kmaClient = { getForecast: jest.fn() } as unknown as jest.Mocked<KmaWeatherClient>;
    cache = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: WeatherRepository, useValue: repository },
        { provide: KmaWeatherClient, useValue: kmaClient },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(WeatherService);
  });

  describe('조건 미충족 → null 또는 예외', () => {
    it('초대장 없음 → NotFoundException', async () => {
      repository.findInvitationWithLocation.mockResolvedValue(null);
      await expect(service.getWeather('inv-1')).rejects.toThrow(NotFoundException);
    });

    it('eventStartAt 없음 → null', async () => {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: null,
        eventLocation: { lat: 37.5, lng: 127.0 },
      });
      expect(await service.getWeather('inv-1')).toBeNull();
    });

    it('eventLocation 없음 → null', async () => {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: FUTURE_24H,
        eventLocation: null,
      });
      expect(await service.getWeather('inv-1')).toBeNull();
    });

    it('이미 지난 이벤트 → null', async () => {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: new Date(Date.now() - 1000),
        eventLocation: { lat: 37.5, lng: 127.0 },
      });
      expect(await service.getWeather('inv-1')).toBeNull();
    });

    it('72시간 초과 이벤트 → null (단기예보 범위 초과)', async () => {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: new Date(Date.now() + 73 * 60 * 60 * 1000),
        eventLocation: { lat: 37.5, lng: 127.0 },
      });
      expect(await service.getWeather('inv-1')).toBeNull();
    });
  });

  describe('캐시 hit/miss', () => {
    beforeEach(() => {
      repository.findInvitationWithLocation.mockResolvedValue(mockInvitation);
      kmaClient.getForecast.mockResolvedValue(mockForecastItems);
      cache.set.mockResolvedValue(undefined);
    });

    it('캐시 miss → KMA API 호출 + 캐시 저장', async () => {
      cache.get.mockResolvedValue(null);

      await service.getWeather('inv-1');

      expect(kmaClient.getForecast).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledTimes(1);
    });

    it('캐시 hit → KMA API 미호출', async () => {
      cache.get.mockResolvedValue(mockForecastItems);

      await service.getWeather('inv-1');

      expect(kmaClient.getForecast).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('동일 격자 두 번째 요청 → KMA API 1회만 호출', async () => {
      cache.get
        .mockResolvedValueOnce(null)               // 첫 요청: miss
        .mockResolvedValueOnce(mockForecastItems); // 두 번째: hit

      await service.getWeather('inv-1');
      await service.getWeather('inv-2');

      expect(kmaClient.getForecast).toHaveBeenCalledTimes(1);
    });

    it('캐시 키에 격자 좌표(nx, ny) 포함', async () => {
      cache.get.mockResolvedValue(null);

      await service.getWeather('inv-1');

      const cacheKey: string = cache.get.mock.calls[0][0];
      expect(cacheKey).toMatch(/weather:\d+:\d+:/);
    });
  });

  describe('Redis 장애 시 fallback', () => {
    beforeEach(() => {
      repository.findInvitationWithLocation.mockResolvedValue(mockInvitation);
      kmaClient.getForecast.mockResolvedValue(mockForecastItems);
    });

    it('cache.get timeout → KMA API 직접 호출, 결과 정상 반환', async () => {
      cache.get.mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout after 500ms')), 10),
        ),
      );
      cache.set.mockResolvedValue(undefined);

      const result = await service.getWeather('inv-1');

      expect(kmaClient.getForecast).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
    });

    it('cache.set 실패 → 결과 정상 반환 (캐시는 옵셔널 레이어)', async () => {
      cache.get.mockResolvedValue(null);
      cache.set.mockRejectedValue(new Error('Redis connection refused'));

      const result = await service.getWeather('inv-1');

      expect(result).not.toBeNull();
    });
  });

  describe('응답 DTO', () => {
    beforeEach(() => {
      repository.findInvitationWithLocation.mockResolvedValue(mockInvitation);
      cache.get.mockResolvedValue(mockForecastItems);
    });

    it('condition, temperature, precipProbability, message 모두 포함', async () => {
      const result = await service.getWeather('inv-1');

      expect(result).toMatchObject({
        condition: expect.any(String),
        temperature: expect.any(Number),
        precipProbability: expect.any(Number),
        message: expect.any(String),
      });
    });
  });
});
