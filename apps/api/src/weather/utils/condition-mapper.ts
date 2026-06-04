export type WeatherCondition = '맑음' | '구름 조금' | '흐림' | '비' | '비/눈' | '소나기' | '눈';

// 기상청 PTY(강수형태) 코드: 0=없음, 1=비, 2=비/눈(진눈깨비), 3=눈, 4=소나기
const PTY_MAP: Record<string, WeatherCondition> = {
  '1': '비',
  '2': '비/눈',
  '3': '눈',
  '4': '소나기',
};

// 기상청 SKY(하늘상태) 코드: 1=맑음, 3=구름많음, 4=흐림 (2는 미사용)
const SKY_MAP: Record<string, WeatherCondition> = {
  '1': '맑음',
  '3': '구름 조금',
  '4': '흐림',
};

const MESSAGE: Record<WeatherCondition, string> = {
  '맑음': '가볍게 입고 와도 좋아요',
  '구름 조금': '가볍게 입고 와도 좋아요',
  '흐림': '겉옷 하나 챙기면 좋아요',
  '비': '우산 꼭 챙기세요',
  '비/눈': '우산 챙기고 미끄러운 길 조심하세요',
  '소나기': '접이식 우산 챙기면 좋아요',
  '눈': '미끄러우니 조심해서 오세요',
};

// PTY 우선 적용, PTY=0이면 SKY 기준, 알 수 없는 값은 '흐림' fallback
export function toCondition(sky: string, pty: string): WeatherCondition {
  return PTY_MAP[pty] ?? SKY_MAP[sky] ?? '흐림';
}

export function toMessage(condition: WeatherCondition): string {
  return MESSAGE[condition];
}
