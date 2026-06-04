import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { WeatherService } from './weather.service';
import { WeatherResponseDto } from './dto/weather-response.dto';

@Controller('invitations/:invitationId/weather')
@UseGuards(ParticipantGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WeatherResponseDto | void> {
    const result = await this.weatherService.getWeather(invitationId);
    if (!result) {
      res.status(204).send();
      return;
    }
    return result;
  }
}
