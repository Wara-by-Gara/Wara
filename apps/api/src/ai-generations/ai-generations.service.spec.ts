/**
 * AiGenerationsService 단위 테스트
 *
 * 검증 대상:
 * - 한도(AI_DAILY_LIMIT=3)가 ai_image_jobs + ai_generations 두 테이블 합산으로 적용
 * - 서킷 브레이커 통과 차단 (AI_SERVICE_UNAVAILABLE)
 * - sourceImageKey path 화이트리스트 (INSUFFICIENT_ROLE)
 * - 잘못된 templateId → AI_TEMPLATE_NOT_FOUND
 * - getGeneration 본인 검증 + completed 시 다운로드 URL 발급
 *
 * setImmediate로 호출되는 processAsync는 S3/OpenAI 모킹 부담이 커서
 * 본 단위 테스트에서는 다루지 않음(통합 테스트 영역).
 */
import {
  ForbiddenException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { AiGenerationsService } from './ai-generations.service';
import type { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

// 각 mock 객체는 필요한 메서드만 부분 제공해도 default와 spread로 메꿔진다.
type MockObj = Record<string, jest.Mock>;
interface Mocks {
  repository: MockObj;
  aiJobsRepository: MockObj;
  templatesRepository: MockObj;
  aiService: MockObj;
  aiMonitoringService: { isCircuitOpen: boolean };
  s3Service: MockObj;
  gateway: MockObj;
}

const STUB_TEMPLATE = {
  id: 'tpl1',
  previewImageKey: 'templates/tpl1.png',
  prompt: null,
};

function createService(mocks: Partial<Mocks> = {}): {
  service: AiGenerationsService;
  m: Mocks;
} {
  const m: Mocks = {
    repository: mocks.repository ?? {
      create: jest.fn().mockResolvedValue({ id: 'gen1', status: 'pending' }),
      findById: jest.fn(),
      countTodayByUser: jest.fn().mockResolvedValue(0),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    },
    aiJobsRepository: mocks.aiJobsRepository ?? {
      countTodayByUser: jest.fn().mockResolvedValue(0),
    },
    templatesRepository: mocks.templatesRepository ?? {
      findById: jest.fn().mockResolvedValue(STUB_TEMPLATE),
    },
    aiService: mocks.aiService ?? {
      compositeImages: jest.fn().mockResolvedValue(Buffer.from('result')),
    },
    aiMonitoringService: mocks.aiMonitoringService ?? { isCircuitOpen: false },
    s3Service: mocks.s3Service ?? {
      getDownloadPresignedUrl: jest.fn().mockResolvedValue('https://signed.example/x.png'),
      getObjectBuffer: jest.fn().mockResolvedValue(Buffer.from('source')),
      putObjectBuffer: jest.fn().mockResolvedValue(undefined),
    },
    gateway: mocks.gateway ?? {
      emitGenerationCompleted: jest.fn(),
      emitGenerationFailed: jest.fn(),
    },
  };

  const service = new AiGenerationsService(
    m.repository as never,
    m.aiJobsRepository as never,
    m.templatesRepository as never,
    m.aiService as never,
    m.aiMonitoringService as never,
    m.s3Service as never,
    m.gateway as never,
  );

  return { service, m };
}

const VALID_DTO: CreateAiGenerationDto = {
  templateId: 'tpl1',
  sourceImageKey: 'public/invitations/abc.webp',
};

describe('AiGenerationsService.createGeneration', () => {
  it('정상 흐름 — 잡 row 생성 + pending 반환', async () => {
    const { service, m } = createService();
    const result = await service.createGeneration(VALID_DTO, 'user1');
    expect(result).toEqual({ id: 'gen1', status: 'pending' });
    expect(m.repository.create).toHaveBeenCalledWith({
      userId: 'user1',
      templateId: 'tpl1',
      sourceImageKey: 'public/invitations/abc.webp',
    });
  });

  it('허용 안 된 path prefix → 403 INSUFFICIENT_ROLE', async () => {
    const { service } = createService();
    await expect(
      service.createGeneration(
        { ...VALID_DTO, sourceImageKey: '../etc/passwd' },
        'user1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('서킷 오픈 시 → 503 AI_SERVICE_UNAVAILABLE', async () => {
    const { service } = createService({
      aiMonitoringService: { isCircuitOpen: true },
    });
    await expect(service.createGeneration(VALID_DTO, 'user1')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('템플릿 없으면 → 404 AI_TEMPLATE_NOT_FOUND', async () => {
    const { service } = createService({
      templatesRepository: { findById: jest.fn().mockResolvedValue(undefined) },
    });
    await expect(service.createGeneration(VALID_DTO, 'user1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('한도 합산 — invitation 잡 2 + 본 테이블 1 = 3, 초과로 429', async () => {
    const { service } = createService({
      aiJobsRepository: { countTodayByUser: jest.fn().mockResolvedValue(2) },
      repository: {
        create: jest.fn(),
        findById: jest.fn(),
        countTodayByUser: jest.fn().mockResolvedValue(1),
        updateStatus: jest.fn(),
      },
    });
    await expect(service.createGeneration(VALID_DTO, 'user1')).rejects.toThrow(
      HttpException,
    );
  });

  it('한도 합산 — invitation 잡 3 + 본 테이블 0 = 3, 초과로 429', async () => {
    const { service } = createService({
      aiJobsRepository: { countTodayByUser: jest.fn().mockResolvedValue(3) },
    });
    await expect(service.createGeneration(VALID_DTO, 'user1')).rejects.toThrow(
      HttpException,
    );
  });

  it('한도 미만 — invitation 잡 1 + 본 테이블 1 = 2, 통과', async () => {
    const { service, m } = createService({
      aiJobsRepository: { countTodayByUser: jest.fn().mockResolvedValue(1) },
      repository: {
        create: jest.fn().mockResolvedValue({ id: 'gen1', status: 'pending' }),
        findById: jest.fn(),
        countTodayByUser: jest.fn().mockResolvedValue(1),
        updateStatus: jest.fn().mockResolvedValue(undefined),
      },
    });
    const result = await service.createGeneration(VALID_DTO, 'user1');
    expect(result.id).toBe('gen1');
    expect(m.repository.create).toHaveBeenCalled();
  });
});

describe('AiGenerationsService.getGeneration', () => {
  it('본인 아님 → 404', async () => {
    const { service } = createService({
      repository: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue({
          id: 'gen1',
          userId: 'someone-else',
          status: 'completed',
          templateId: 'tpl1',
          resultImageKey: 'ai-generations/results/gen1.png',
          errorCode: null,
          createdAt: new Date(),
          completedAt: new Date(),
        }),
        countTodayByUser: jest.fn(),
        updateStatus: jest.fn(),
      },
    });
    await expect(service.getGeneration('gen1', 'user1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('row 없음 → 404', async () => {
    const { service } = createService({
      repository: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue(undefined),
        countTodayByUser: jest.fn(),
        updateStatus: jest.fn(),
      },
    });
    await expect(service.getGeneration('gen1', 'user1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('completed + 본인 → downloadUrl 발급', async () => {
    const { service, m } = createService({
      repository: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue({
          id: 'gen1',
          userId: 'user1',
          status: 'completed',
          templateId: 'tpl1',
          resultImageKey: 'ai-generations/results/gen1.png',
          errorCode: null,
          createdAt: new Date(),
          completedAt: new Date(),
        }),
        countTodayByUser: jest.fn(),
        updateStatus: jest.fn(),
      },
    });
    const result = await service.getGeneration('gen1', 'user1');
    expect(result.downloadUrl).toBe('https://signed.example/x.png');
    expect(m.s3Service.getDownloadPresignedUrl).toHaveBeenCalled();
  });

  it('processing → downloadUrl null', async () => {
    const { service, m } = createService({
      repository: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue({
          id: 'gen1',
          userId: 'user1',
          status: 'processing',
          templateId: 'tpl1',
          resultImageKey: null,
          errorCode: null,
          createdAt: new Date(),
          completedAt: null,
        }),
        countTodayByUser: jest.fn(),
        updateStatus: jest.fn(),
      },
    });
    const result = await service.getGeneration('gen1', 'user1');
    expect(result.downloadUrl).toBeNull();
    expect(m.s3Service.getDownloadPresignedUrl).not.toHaveBeenCalled();
  });

  it('failed → downloadUrl null + errorCode 전달', async () => {
    const { service } = createService({
      repository: {
        create: jest.fn(),
        findById: jest.fn().mockResolvedValue({
          id: 'gen1',
          userId: 'user1',
          status: 'failed',
          templateId: 'tpl1',
          resultImageKey: null,
          errorCode: ErrorCode.AI_TIMEOUT,
          createdAt: new Date(),
          completedAt: new Date(),
        }),
        countTodayByUser: jest.fn(),
        updateStatus: jest.fn(),
      },
    });
    const result = await service.getGeneration('gen1', 'user1');
    expect(result.downloadUrl).toBeNull();
    expect(result.errorCode).toBe(ErrorCode.AI_TIMEOUT);
  });
});
