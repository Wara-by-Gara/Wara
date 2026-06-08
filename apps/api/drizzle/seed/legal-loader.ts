import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { NewServiceTerm } from '../../src/database/schema';
import { id } from './fixtures';

const LEGAL_DIR = join(__dirname, '..', '..', '..', '..', 'docs', 'legal');

type Frontmatter = {
  documentId: string;
  termType: 'service' | 'privacy' | 'marketing' | 'location' | 'analytics' | 'age';
  version: string;
  title: string;
  effectiveDate: string | Date;
  required: boolean;
};

function isValidFrontmatter(data: unknown): data is Frontmatter {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.documentId === 'string' &&
    typeof d.termType === 'string' &&
    ['service', 'privacy', 'marketing', 'location', 'analytics', 'age'].includes(d.termType) &&
    typeof d.version === 'string' &&
    typeof d.title === 'string' &&
    (typeof d.effectiveDate === 'string' || d.effectiveDate instanceof Date) &&
    typeof d.required === 'boolean'
  );
}

export function loadLegalSeeds(): NewServiceTerm[] {
  const files = readdirSync(LEGAL_DIR).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const raw = readFileSync(join(LEGAL_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    if (!isValidFrontmatter(data)) {
      throw new Error(`Invalid frontmatter in docs/legal/${file}`);
    }
    const effectiveDate = new Date(data.effectiveDate);
    return {
      id: id(`term:${data.documentId}`),
      documentId: data.documentId,
      termType: data.termType,
      version: data.version,
      title: data.title,
      content: content.trim(),
      isActive: true,
      isRequired: data.required,
      effectiveDate,
      publishedAt: effectiveDate,
      createdBy: null,
    };
  });
}
