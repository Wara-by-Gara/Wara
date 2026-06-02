import { apiFetch } from './client';

export type TermType = 'service' | 'privacy' | 'marketing' | 'location';

export interface ServiceTerm {
  id: string;
  termType: TermType;
  version: string;
  title: string;
  content: string;
  isActive: boolean;
  isRequired: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TermAgreement {
  id: string;
  userId: string;
  termId: string;
  agreedAt: string;
  term: ServiceTerm;
}

export const termsKeys = {
  all: ['terms'] as const,
  list: () => [...termsKeys.all, 'list'] as const,
  myAgreements: () => [...termsKeys.all, 'agreements', 'me'] as const,
};

export function fetchTerms(signal?: AbortSignal): Promise<ServiceTerm[]> {
  return apiFetch<ServiceTerm[]>('/terms', { authenticated: false, signal });
}

export function fetchMyAgreements(signal?: AbortSignal): Promise<TermAgreement[]> {
  return apiFetch<TermAgreement[]>('/terms/agreements/me', { signal });
}

export function agreeTerms(termIds: string[]): Promise<TermAgreement[]> {
  return apiFetch<TermAgreement[]>('/terms/agreements', {
    method: 'POST',
    body: { termIds },
  });
}
