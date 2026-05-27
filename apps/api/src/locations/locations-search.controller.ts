import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  PlaceSearchQuerySchema,
  type PlaceSearchQueryDto,
} from './dto/place-search-query.dto';

@Controller('locations')
export class LocationsSearchController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Get('search')
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
