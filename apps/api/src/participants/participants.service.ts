import { Injectable } from '@nestjs/common';
import { ParticipantsRepository } from './participants.repository';

@Injectable()
export class ParticipantsService {
  constructor(private readonly repository: ParticipantsRepository) {}
}
