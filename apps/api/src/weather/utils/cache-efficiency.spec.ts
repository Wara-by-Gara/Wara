/**
 * 격자 단위 캐시 vs 초대장 단위 캐시 효율 비교
 *
 * 실제 WeatherService는 격자 단위(nx:ny:date:time)로 캐시 키를 설계.
 * 만약 초대장 ID 단위로 캐시했다면 동일 지역 초대장마다 기상청 API를 중복 호출.
 * 이 테스트는 두 방식의 API 호출 횟수 차이를 수치로 검증.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WeatherService } from '../weather.service';
import { WeatherRepository } from '../weather.repository';
import { KmaWeatherClient } from '../kma-weather.client';
import type { KmaForecastItem } from '../kma-weather.client';

const FUTURE_24H = new Date(Date.now() + 24 * 60 * 60 * 1000);

const mockForecastItems: KmaForecastItem[] = [
  { category: 'TMP', fcstDate: '20250616', fcstTime: '1200', fcstValue: '22' },
  { category: 'SKY', fcstDate: '20250616', fcstTime: '1200', fcstValue: '1' },
  { category: 'PTY', fcstDate: '20250616', fcstTime: '1200', fcstValue: '0' },
  { category: 'POP', fcstDate: '20250616', fcstTime: '1200', fcstValue: '10' },
];

// 서울 근처 동일 격자(NX=60, NY=127)에 속하는 5개 초대장 위치
const SAME_GRID_INVITATIONS = [
  { id: 'inv-1', lat: 37.5665, lng: 126.978 },  // 서울 시청
  { id: 'inv-2', lat: 37.5670, lng: 126.979 },  // 100m 근처
  { id: 'inv-3', lat: 37.5660, lng: 126.977 },  // 100m 근처
  { id: 'inv-4', lat: 37.5672, lng: 126.980 },  // 100m 근처
  { id: 'inv-5', lat: 37.5658, lng: 126.976 },  // 100m 근처
];

describe('격자 단위 캐시 효율 비교', () => {
  let service: WeatherService;
  let repository: jest.Mocked<WeatherRepository>;
  let kmaClient: jest.Mocked<KmaWeatherClient>;

  beforeEach(async () => {
    repository = { findInvitationWithLocation: jest.fn() } as unknown as jest.Mocked<WeatherRepository>;
    kmaClient = { getForecast: jest.fn() } as unknown as jest.Mocked<KmaWeatherClient>;
    kmaClient.getForecast.mockResolvedValue(mockForecastItems);
  });

  it('격자 단위 캐시: 동일 지역 초대장 5개 → 기상청 API 1회 호출', async () => {
    // 실제 WeatherService 동작: 격자 단위 캐시 키 사용
    const cacheStore = new Map<string, unknown>();
    const gridCache = {
      get: jest.fn((key: string) => Promise.resolve(cacheStore.get(key) ?? null)),
      set: jest.fn((key: string, value: unknown) => {
        cacheStore.set(key, value);
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: WeatherRepository, useValue: repository },
        { provide: KmaWeatherClient, useValue: kmaClient },
        { provide: CACHE_MANAGER, useValue: gridCache },
      ],
    }).compile();

    service = module.get(WeatherService);

    for (const inv of SAME_GRID_INVITATIONS) {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: FUTURE_24H,
        eventLocation: { lat: inv.lat, lng: inv.lng },
      });
      await service.getWeather(inv.id);
    }

    // 격자 단위 캐시: 첫 요청만 API 호출, 나머지 4개는 캐시 hit
    expect(kmaClient.getForecast).toHaveBeenCalledTimes(1);
  });

  it('초대장 단위 캐시(비교군): 동일 지역 초대장 5개 → 기상청 API 5회 호출', async () => {
    // 가상 시나리오: 초대장 ID 기반 캐시 (항상 miss)
    const invitationCache = {
      get: jest.fn(() => Promise.resolve(null)), // 항상 miss
      set: jest.fn(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: WeatherRepository, useValue: repository },
        { provide: KmaWeatherClient, useValue: kmaClient },
        { provide: CACHE_MANAGER, useValue: invitationCache },
      ],
    }).compile();

    service = module.get(WeatherService);

    for (const inv of SAME_GRID_INVITATIONS) {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: FUTURE_24H,
        eventLocation: { lat: inv.lat, lng: inv.lng },
      });
      await service.getWeather(inv.id);
    }

    // 초대장 단위 캐시: 매번 miss → 5회 호출
    expect(kmaClient.getForecast).toHaveBeenCalledTimes(5);
  });

  it('격자 단위 캐시 절감률: 동일 지역 5개 요청 기준 80% API 호출 절감', async () => {
    const cacheStore = new Map<string, unknown>();
    const gridCache = {
      get: jest.fn((key: string) => Promise.resolve(cacheStore.get(key) ?? null)),
      set: jest.fn((key: string, value: unknown) => {
        cacheStore.set(key, value);
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: WeatherRepository, useValue: repository },
        { provide: KmaWeatherClient, useValue: kmaClient },
        { provide: CACHE_MANAGER, useValue: gridCache },
      ],
    }).compile();

    service = module.get(WeatherService);

    for (const inv of SAME_GRID_INVITATIONS) {
      repository.findInvitationWithLocation.mockResolvedValue({
        eventStartAt: FUTURE_24H,
        eventLocation: { lat: inv.lat, lng: inv.lng },
      });
      await service.getWeather(inv.id);
    }

    const totalRequests = SAME_GRID_INVITATIONS.length; // 5
    const actualApiCalls = kmaClient.getForecast.mock.calls.length; // 1
    const reductionRate = ((totalRequests - actualApiCalls) / totalRequests) * 100;

    expect(reductionRate).toBe(80); // 5개 요청 중 4개 절감 = 80%
  });
});
