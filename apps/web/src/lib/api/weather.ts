import { apiGet } from './client';
import type { WeatherCondition } from '@/components/organisms/WeatherCard';

export type WeatherConditionKo =
  | '맑음'
  | '구름 조금'
  | '흐림'
  | '비'
  | '비/눈'
  | '소나기'
  | '눈';

export interface WeatherSummary {
  condition: WeatherConditionKo;
  temperature: number;
  precipProbability: number;
  message: string;
}

const CONDITION_KO_TO_EN: Record<WeatherConditionKo, WeatherCondition> = {
  '맑음': 'sunny',
  '구름 조금': 'partlyCloudy',
  '흐림': 'overcast',
  '비': 'rainy',
  '비/눈': 'rainOrSnow',
  '소나기': 'shower',
  '눈': 'snowy',
};

export function toWeatherCardCondition(condition: WeatherConditionKo): WeatherCondition {
  return CONDITION_KO_TO_EN[condition];
}

export async function getWeather(invitationId: string): Promise<WeatherSummary | null> {
  const result = await apiGet<WeatherSummary | undefined>(
    `/invitations/${invitationId}/weather`,
  );
  return result ?? null;
}
