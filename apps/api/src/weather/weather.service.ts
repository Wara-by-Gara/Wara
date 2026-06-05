import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { KmaWeatherClient, KmaForecastItem } from './kma-weather.client';
import { WeatherRepository } from './weather.repository';
import { latLngToGrid } from './utils/grid-converter';
import { getBaseDateTime, getForecastTime, getForecastDate } from './utils/base-time';
import { toCondition, toMessage } from './utils/condition-mapper';
import { WeatherResponseDto } from './dto/weather-response.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { withTimeout } from '../common/utils/with-timeout';

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3시간 (base_time 발표 주기)
const FORECAST_WINDOW_MS = 72 * 60 * 60 * 1000; // 단기예보 최대 제공 범위 3일
const CACHE_OP_TIMEOUT_MS = 500; // Redis 다운 시 빠르게 KMA fallback으로 전환하기 위한 타임아웃

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly weatherRepository: WeatherRepository,
    private readonly kmaClient: KmaWeatherClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getWeather(invitationId: string): Promise<WeatherResponseDto | null> {
    const invitation = await this.weatherRepository.findInvitationWithLocation(invitationId);
    if (!invitation) {
      throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    }

    const { eventStartAt, eventLocation } = invitation;

    if (!eventStartAt || !eventLocation) return null;

    const now = Date.now();
    if (eventStartAt.getTime() < now) return null;
    if (eventStartAt.getTime() - now > FORECAST_WINDOW_MS) return null;

    const { nx, ny } = latLngToGrid(eventLocation.lat, eventLocation.lng);
    const { baseDate, baseTime } = getBaseDateTime(new Date());
    const fcstTime = getForecastTime(eventStartAt);
    const fcstDate = getForecastDate(eventStartAt);

    const cacheKey = `weather:${nx}:${ny}:${baseDate}:${baseTime}`;
    const cached = await this.tryGetCache(cacheKey);
    const cacheHit = cached !== null;
    let items: KmaForecastItem[];

    if (cached) {
      items = cached;
    } else {
      items = await this.kmaClient.getForecast({ nx, ny, base_date: baseDate, base_time: baseTime });
      await this.trySetCache(cacheKey, items);
    }

    this.logger.debug(
      `weather invitationId=${invitationId} nx=${nx} ny=${ny} base=${baseDate}/${baseTime} fcst=${fcstDate}/${fcstTime} cache=${cacheHit ? 'hit' : 'miss'}`,
    );

    const forTime = items.filter((i) => i.fcstDate === fcstDate && i.fcstTime === fcstTime);

    const get = (category: string) => forTime.find((i) => i.category === category)?.fcstValue ?? '0';

    const sky = get('SKY');
    const pty = get('PTY');
    const tmp = get('TMP');
    const pop = get('POP');

    const condition = toCondition(sky, pty);

    return {
      condition,
      temperature: Number(tmp),
      precipProbability: Number(pop),
      message: toMessage(condition),
    };
  }

  // Redis 장애 시 KMA 직접 호출로 degrade — 캐시 자체는 옵셔널 레이어.
  // @keyv/redis는 연결 실패 시 hang 가능성 있어 timeout으로 강제 fallback.
  private async tryGetCache(key: string): Promise<KmaForecastItem[] | null> {
    try {
      const cached = await withTimeout(this.cache.get<KmaForecastItem[]>(key), CACHE_OP_TIMEOUT_MS);
      return cached ?? null;
    } catch (err) {
      this.logger.warn(`cache get 실패 (fallback): ${(err as Error).message}`);
      return null;
    }
  }

  private async trySetCache(key: string, value: KmaForecastItem[]): Promise<void> {
    try {
      await withTimeout(this.cache.set(key, value, CACHE_TTL_MS), CACHE_OP_TIMEOUT_MS);
    } catch (err) {
      this.logger.warn(`cache set 실패 (무시): ${(err as Error).message}`);
    }
  }
}
