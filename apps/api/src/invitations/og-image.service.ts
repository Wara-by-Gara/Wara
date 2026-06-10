import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { InvitationsRepository } from './invitations.repository';
import sharp from 'sharp';

const GIF_FETCH_TIMEOUT_MS = 3000;

@Injectable()
export class OgImageService {
  private readonly logger = new Logger(OgImageService.name);

  constructor(
    private readonly repository: InvitationsRepository,
    private readonly httpService: HttpService,
  ) {}

  async getOgImageBuffer(invitationId: string): Promise<
    | { type: 'png'; buffer: Buffer }
    | { type: 'notfound' }
  > {
    const invitation = await this.repository.findCoverById(invitationId);

    if (!invitation || invitation.mainCoverType !== 'gif' || !invitation.mainGifUrl) {
      return { type: 'notfound' };
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<ArrayBuffer>(invitation.mainGifUrl, { responseType: 'arraybuffer' })
          .pipe(timeout(GIF_FETCH_TIMEOUT_MS)),
      );
      const pngBuffer = await sharp(Buffer.from(response.data)).png().toBuffer();
      return { type: 'png', buffer: pngBuffer };
    } catch (err) {
      this.logger.warn(`GIF fetch/convert failed for ${invitationId}: ${(err as Error).message}`);
      return { type: 'notfound' };
    }
  }
}
