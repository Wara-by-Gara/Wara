/**
 * AiMonitoringService — 서킷 브레이커 상태 전이 단위 테스트
 *
 * 검증 대상:
 * - 임계치 미만 → 상태 변화 없음
 * - 경고 임계치(30) ≤ count < open 임계치(60) → 경고 로그, 서킷 그대로 닫힘
 * - open 임계치(60) 이상 → 서킷 오픈
 * - 한 번 오픈된 후 정상 count로 떨어져도 30분 경과 전엔 오픈 유지
 * - 30분 경과 후 isCircuitOpen 접근 시 자동 복구 (closed로 전환)
 *
 * DB select 호출은 모킹 — 본 spec은 카운트 → 상태 전이 로직만 검증.
 */
import { AiMonitoringService } from './ai-monitoring.service';

function makeService(initialCount: number) {
  const mutableCount = { value: initialCount };

  // db.select().from(aiImageJobs).where(...) 체이닝을 흉내. 마지막 await 시 카운트 반환.
  const db = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(async () => [
          { cnt: mutableCount.value },
        ]),
      }),
    }),
  } as unknown as ConstructorParameters<typeof AiMonitoringService>[0];

  const service = new AiMonitoringService(db);
  return { service, mutableCount };
}

describe('AiMonitoringService.checkAiUsageSpike', () => {
  it('임계치 미만 (count=10) — 상태 변화 없음', async () => {
    const { service } = makeService(10);
    await service.checkAiUsageSpike();
    expect(service.isCircuitOpen).toBe(false);
  });

  it('경고 임계치 (count=30) — 서킷 그대로 closed', async () => {
    const { service } = makeService(30);
    await service.checkAiUsageSpike();
    expect(service.isCircuitOpen).toBe(false);
  });

  it('경고와 오픈 사이 (count=59) — 여전히 closed', async () => {
    const { service } = makeService(59);
    await service.checkAiUsageSpike();
    expect(service.isCircuitOpen).toBe(false);
  });

  it('오픈 임계치 (count=60) — 서킷 오픈', async () => {
    const { service } = makeService(60);
    await service.checkAiUsageSpike();
    expect(service.isCircuitOpen).toBe(true);
  });

  it('오픈 후 count가 정상으로 떨어져도 30분 전엔 오픈 유지', async () => {
    const { service, mutableCount } = makeService(100);
    await service.checkAiUsageSpike();
    expect(service.isCircuitOpen).toBe(true);

    // 트래픽 가라앉음 — 다음 체크에서 count가 정상.
    mutableCount.value = 5;
    await service.checkAiUsageSpike();
    // 30분 자동 복구 윈도우 전이므로 여전히 오픈.
    expect(service.isCircuitOpen).toBe(true);
  });

  it('오픈된 지 30분 이상 경과 → isCircuitOpen 접근 시 자동 복구', async () => {
    const { service } = makeService(60);
    await service.checkAiUsageSpike();
    expect(service.isCircuitOpen).toBe(true);

    // circuitOpenedAt을 31분 전으로 강제 변경하여 자동 복구 윈도우 진입.
    const past = new Date(Date.now() - 31 * 60 * 1000);
    (service as unknown as { circuitOpenedAt: Date }).circuitOpenedAt = past;

    expect(service.isCircuitOpen).toBe(false);
  });

  it('DB 에러 발생 시 throw 안 하고 로그만 — 서킷 상태 변화 없음', async () => {
    const db = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockRejectedValue(new Error('db down')),
        }),
      }),
    } as unknown as ConstructorParameters<typeof AiMonitoringService>[0];
    const service = new AiMonitoringService(db);

    await expect(service.checkAiUsageSpike()).resolves.toBeUndefined();
    expect(service.isCircuitOpen).toBe(false);
  });
});
