import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KmaWeatherClient, KmaForecastItem } from './kma-weather.client';
import { WeatherRepository } from './weather.repository';
import { latLngToGrid } from './utils/grid-converter';
import { getBaseDateTime, getForecastTime, getForecastDate } from './utils/base-time';
import { toCondition, toMessage } from './utils/condition-mapper';
import { WeatherResponseDto } from './dto/weather-response.dto';
import { ErrorCode } from '../common/constants/error-codes';

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3시간 (base_time 발표 주기)
const FORECAST_WINDOW_MS = 72 * 60 * 60 * 1000; // 단기예보 최대 제공 범위 3일

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, { data: KmaForecastItem[]; expiresAt: number }>();

  constructor(
    private readonly weatherRepository: WeatherRepository,
    private readonly kmaClient: KmaWeatherClient,
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
    let cacheHit = false;
    let items: KmaForecastItem[];

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      items = cached.data;
      cacheHit = true;
    } else {
      items = await this.kmaClient.getForecast({ nx, ny, base_date: baseDate, base_time: baseTime });
      this.cache.set(cacheKey, { data: items, expiresAt: now + CACHE_TTL_MS });
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
}
