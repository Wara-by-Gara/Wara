import { Injectable, InternalServerErrorException, GatewayTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { toFile } from 'openai';
import { ErrorCode } from '../common/constants/error-codes';

const AI_TIMEOUT_MS = 60_000;

@Injectable()
export class AiService {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow('OPENAI_API_KEY'),
    });
  }

  /**
   * 사용자 사진 + 템플릿 이미지를 OpenAI gpt-image-1 edit API로 합성
   * @param userImageBuffer  사용자가 업로드한 원본 사진 Buffer
   * @param templateBuffer   초대장 템플릿 배경 이미지 Buffer
   * @param prompt           합성 방향 프롬프트
   * @returns 합성된 이미지 Buffer (PNG)
   */
  async compositeImages(
    userImageBuffer: Buffer,
    templateBuffer: Buffer,
    prompt: string,
  ): Promise<Buffer> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const [userFile, templateFile] = await Promise.all([
        toFile(userImageBuffer, 'user-photo.png', { type: 'image/png' }),
        toFile(templateBuffer, 'template.png', { type: 'image/png' }),
      ]);

      const response = await this.client.images.edit(
        {
          model: 'gpt-image-1',
          image: [userFile, templateFile],
          prompt,
          n: 1,
          size: '1024x1024',
        },
        { signal: controller.signal },
      );

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) {
        throw new InternalServerErrorException(ErrorCode.AI_PROCESSING_FAILED);
      }

      return Buffer.from(b64, 'base64');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new GatewayTimeoutException(ErrorCode.AI_TIMEOUT);
      }
      if (
        err instanceof InternalServerErrorException ||
        err instanceof GatewayTimeoutException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(ErrorCode.AI_PROCESSING_FAILED);
    } finally {
      clearTimeout(timer);
    }
  }
}
