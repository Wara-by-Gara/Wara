import { Injectable } from '@nestjs/common';
import { PhotosRepository } from './photos.repository';

@Injectable()
export class PhotosService {
  constructor(private readonly repository: PhotosRepository) {}
}
