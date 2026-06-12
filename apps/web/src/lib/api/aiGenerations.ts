import { apiGet, apiPost } from "./client";

export type AiGenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface AiGenerationDetail {
  id: string;
  status: AiGenerationStatus;
  templateId: string;
  downloadUrl: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateAiGenerationInput {
  templateId: string;
  sourceImageKey: string;
}

export function createAiGeneration(
  input: CreateAiGenerationInput,
  idempotencyKey: string,
): Promise<{ id: string; status: AiGenerationStatus }> {
  return apiPost("/ai/generations", input, { idempotencyKey });
}

export function getAiGeneration(id: string): Promise<AiGenerationDetail> {
  return apiGet(`/ai/generations/${id}`);
}
