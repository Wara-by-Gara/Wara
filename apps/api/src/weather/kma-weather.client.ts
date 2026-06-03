import { Injectable, GatewayTimeoutException, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { ErrorCode } from '../common/constants/error-codes';

const KMA_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
const TIMEOUT_MS = 10_000;

export interface KmaForecastParams {
  nx: number;
  ny: number;
  base_date: string; // YYYYMMDD
  base_time: string; // HHmm
}

export interface KmaForecastItem {
  category: string;
  fcstDate: string; // YYYYMMDD
  fcstTime: string; // HHmm
  fcstValue: string;
}

@Injectable()
export class KmaWeatherClient {
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('KMA_API_KEY');
  }

  async getForecast(params: KmaForecastParams): Promise<KmaForecastItem[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<KmaApiResponse>(KMA_URL, {
            params: {
              serviceKey: this.apiKey,
              pageNo: 1,
              numOfRows: 1000,
              dataType: 'JSON',
              base_date: params.base_date,
              base_time: params.base_time,
              nx: params.nx,
              ny: params.ny,
            },
          })
          .pipe(timeout(TIMEOUT_MS)),
      );

      if (data.response.header.resultCode !== '00') {
        throw new BadGatewayException(ErrorCode.WEATHER_API_FAILED);
      }

      const items = data?.response?.body?.items?.item;
      if (!items) throw new BadGatewayException(ErrorCode.WEATHER_API_FAILED);

      return items.filter((item) =>
        ['TMP', 'SKY', 'PTY', 'POP'].includes(item.category),
      );
    } catch (err) {
      if (err instanceof BadGatewayException || err instanceof GatewayTimeoutException) {
        throw err;
      }
      // rxjs timeout → TimeoutError
      if ((err as Error).name === 'TimeoutError') {
        throw new GatewayTimeoutException(ErrorCode.WEATHER_API_TIMEOUT);
      }
      throw new BadGatewayException(ErrorCode.WEATHER_API_FAILED);
    }
  }
}

interface KmaApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: KmaForecastItem[] };
    };
  };
}
