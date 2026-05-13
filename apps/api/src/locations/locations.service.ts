import { Injectable } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';

@Injectable()
export class LocationsService {
  constructor(private readonly repository: LocationsRepository) {}
}
