import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherRepository } from './weather.repository';
import { KmaWeatherClient } from './kma-weather.client';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherRepository, KmaWeatherClient],
})
export class WeatherModule {}
