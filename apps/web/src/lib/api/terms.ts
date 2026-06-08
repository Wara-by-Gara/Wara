import { apiGet, apiPost } from './client';

export type TermType =
  | 'service'
  | 'privacy'
  | 'marketing'
  | 'location'
  | 'analytics'
  | 'age';

export interface ServiceTerm {
  id: string;
  documentId: string;
  termType: TermType;
  version: string;
  title: string;
  content: string;
  isActive: boolean;
  isRequired: boolean;
  effectiveDate: string;
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
