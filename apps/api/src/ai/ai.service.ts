import { Injectable, InternalServerErrorException, GatewayTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { toFile } from 'openai';
import { ErrorCode } from '../common/constants/error-codes';

const AI_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_000;
/** 일시적 오류로 재시도 가능한 HTTP 상태 코드 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

@Injectable()
export class AiService {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow('OPENAI_API_KEY'),
    });
  }

  /**
   * 사용자 사진 + 템플릿 이미지를 OpenAI gpt-image-1 edit API로 합성.
   * 일시적 에러(429, 5xx, 네트워크)에 대해 최대 2회 지수 백오프 재시도.
   */
  async compositeImages(
    userImageBuffer: Buffer,
    templateBuffer: Buffer,
    prompt: string,
    userImageMime: string = 'image/webp',
  ): Promise<Buffer> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.doCompositeImages(userImageBuffer, templateBuffer, prompt, userImageMime);
      } catch (err) {
        lastError = err;

        // GatewayTimeoutException(AbortError) 또는 이미 분류된 예외는 재시도 없이 즉시 throw
        if (
          err instanceof GatewayTimeoutException ||
          err instanceof InternalServerErrorException
        ) {
          // AI_TIMEOUT은 재시도 불필요. AI_PROCESSING_FAILED는 bad request 등 — 재시도 불필요
          throw err;
        }

        const isRetryable =
          (err instanceof OpenAI.APIError && RETRYABLE_STATUS_CODES.has(err.status ?? 0)) ||
          err instanceof OpenAI.APIConnectionError ||
          err instanceof OpenAI.APIConnectionTimeoutError;

        if (!isRetryable || attempt === MAX_RETRIES) break;

        // 지수 백오프: 1초, 2초
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 최종 에러 분류
    if (lastError instanceof GatewayTimeoutException) throw lastError;
    throw new InternalServerErrorException(ErrorCode.AI_PROCESSING_FAILED);
  }

  private async doCompositeImages(
    userImageBuffer: Buffer,
    templateBuffer: Buffer,
    prompt: string,
    userImageMime: string,
  ): Promise<Buffer> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const ext = userImageMime.split('/')[1] ?? 'webp';
      const [userFile, templateFile] = await Promise.all([
        toFile(userImageBuffer, `user-photo.${ext}`, { type: userImageMime }),
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
      // OpenAI SDK 에러 또는 기타 — 상위 withRetry 루프에서 재시도 여부 결정
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
