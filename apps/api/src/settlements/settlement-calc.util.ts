// 정산 계산 순수 함수 모음. 금액은 모두 원(KRW) 정수.

/** 금액을 참가자 수로 균등 분배. 나눠떨어지지 않는 잔여(원)는 앞 참가자부터 +1씩. */
export function equalSplit(amount: number, participantIds: string[]): Map<string, number> {
  const map = new Map<string, number>();
  const n = participantIds.length;
  if (n === 0) return map;
  const base = Math.floor(amount / n);
  let remainder = amount - base * n;
  for (const id of participantIds) {
    map.set(id, base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return map;
}

export interface ExpenseForCalc {
  payerParticipantId: string;
  amount: number;
  shares: { participantId: string; share: number }[];
}

/** 참가자별 순잔액 = 낸 돈(payer) − 분담액(shares 합). 양수=받을 돈, 음수=낼 돈. */
export function computeNet(expenses: ExpenseForCalc[]): Map<string, number> {
  const net = new Map<string, number>();
  const add = (id: string, v: number) => net.set(id, (net.get(id) ?? 0) + v);
  for (const e of expenses) {
    add(e.payerParticipantId, e.amount);
    for (const s of e.shares) add(s.participantId, -s.share);
  }
  return net;
}

export interface Transfer {
  from: string; // 보내는 사람 participantId
  to: string;   // 받는 사람 participantId
  amount: number;
}

/**
 * 최소 송금 그래프 (max-debtor ↔ max-creditor greedy heuristic).
 * net 합은 0이라고 가정. 정수 금액이라 유한 스텝에 종료.
 */
export function minTransfers(net: Map<string, number>): Transfer[] {
  const bal = [...net.entries()].map(([id, amt]) => ({ id, amt })).filter((b) => b.amt !== 0);
  const transfers: Transfer[] = [];

  for (;;) {
    let maxC = -1;
    let maxD = -1;
    for (let k = 0; k < bal.length; k++) {
      if (maxC < 0 || bal[k]!.amt > bal[maxC]!.amt) maxC = k;
      if (maxD < 0 || bal[k]!.amt < bal[maxD]!.amt) maxD = k;
    }
    if (maxC < 0 || maxD < 0 || bal[maxC]!.amt <= 0 || bal[maxD]!.amt >= 0) break;

    const pay = Math.min(bal[maxC]!.amt, -bal[maxD]!.amt);
    transfers.push({ from: bal[maxD]!.id, to: bal[maxC]!.id, amount: pay });
    bal[maxC]!.amt -= pay;
    bal[maxD]!.amt += pay;
  }

  return transfers;
}
