import { apiGet, apiPost } from './client';

export interface ServiceTerm {
  id: string;
  termType: 'service' | 'privacy' | 'marketing' | 'location';
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

export function getTerms(): Promise<ServiceTerm[]> {
  return apiGet<ServiceTerm[]>('/terms');
}

export function getMyAgreements(): Promise<TermAgreement[]> {
  return apiGet<TermAgreement[]>('/terms/agreements/me');
}

export function agreeTerms(termIds: string[]): Promise<TermAgreement[]> {
  return apiPost<TermAgreement[]>('/terms/agreements', { termIds });
}
