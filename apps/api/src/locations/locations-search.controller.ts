import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LocationsService } from './locations.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  PlaceSearchQuerySchema,
  type PlaceSearchQueryDto,
} from './dto/place-search-query.dto';

@Controller('locations')
export class LocationsSearchController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('search')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  searchPlaces(
    @Query(new ZodValidationPipe(PlaceSearchQuerySchema))
    query: PlaceSearchQueryDto,
  ) {
    return this.locationsService.searchPlaces(
      query.query,
      query.page,
      query.size,
    );
  }
}
