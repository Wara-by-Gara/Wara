import { equalSplit, computeNet, minTransfers } from './settlement-calc.util';

describe('settlement-calc', () => {
  describe('equalSplit', () => {
    it('나눠떨어지면 균등 분배', () => {
      const m = equalSplit(30000, ['a', 'b', 'c']);
      expect([...m.values()]).toEqual([10000, 10000, 10000]);
    });

    it('잔여(원)는 앞 참가자부터 +1, 합은 총액과 일치', () => {
      const m = equalSplit(10000, ['a', 'b', 'c']); // 3334,3333,3333
      expect(m.get('a')).toBe(3334);
      expect(m.get('b')).toBe(3333);
      expect(m.get('c')).toBe(3333);
      expect([...m.values()].reduce((x, y) => x + y, 0)).toBe(10000);
    });
  });

  describe('computeNet', () => {
    it('낸 돈 − 분담액 = 순잔액', () => {
      // a가 30000 결제, 3명 균등(각 10000)
      const net = computeNet([
        { payerParticipantId: 'a', amount: 30000, shares: [
          { participantId: 'a', share: 10000 },
          { participantId: 'b', share: 10000 },
          { participantId: 'c', share: 10000 },
        ] },
      ]);
      expect(net.get('a')).toBe(20000); // 30000 낸 뒤 자기 몫 10000
      expect(net.get('b')).toBe(-10000);
      expect(net.get('c')).toBe(-10000);
    });
  });

  describe('minTransfers', () => {
    it('채무자→채권자 최소 송금, 합은 0', () => {
      const net = new Map([['a', 20000], ['b', -10000], ['c', -10000]]);
      const transfers = minTransfers(net);
      // b,c가 각각 a에게 10000씩
      expect(transfers).toHaveLength(2);
      for (const t of transfers) {
        expect(t.to).toBe('a');
        expect(t.amount).toBe(10000);
      }
      const inbound = transfers.reduce((s, t) => s + t.amount, 0);
      expect(inbound).toBe(20000);
    });

    it('상계 가능한 경우 송금 건수를 최소화', () => {
      // a +30, b -10, c -20 → a에게 b:10, c:20 (2건)
      const net = new Map([['a', 30], ['b', -10], ['c', -20]]);
      const transfers = minTransfers(net);
      expect(transfers.length).toBeLessThanOrEqual(2);
      expect(transfers.reduce((s, t) => s + t.amount, 0)).toBe(30);
    });

    it('잔액 0이면 송금 없음', () => {
      expect(minTransfers(new Map([['a', 0], ['b', 0]]))).toEqual([]);
    });
  });
});
