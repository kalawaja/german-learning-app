import type { WordRow } from '@/lib/database';
import type { Word, Article, AuxiliaryFlags, VerbRegularity } from '@/types/word';

/** Parse DB auxiliary string (e.g. "haben, sein") into flags. Split by comma; both can be true. */
export function parseAuxiliaryFlags(s: string | null | undefined): AuxiliaryFlags | undefined {
  if (s == null || typeof s !== 'string' || !s.trim()) return undefined;
  const parts = s.split(/[,;]/).map((x) => x.trim().toLowerCase());
  const haben = parts.includes('haben');
  const sein = parts.includes('sein');
  if (!haben && !sein) return undefined;
  return { haben, sein };
}

/** Serialize auxiliary flags to DB string (e.g. "haben, sein" when both). */
export function serializeAuxiliaryFlags(f: AuxiliaryFlags | undefined): string | null {
  if (!f) return null;
  if (f.haben && f.sein) return 'haben, sein';
  if (f.haben) return 'haben';
  if (f.sein) return 'sein';
  return null;
}

export function wordRowToWord(row: WordRow): Word {
  const base = {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    wordType: row.word_type as Word['wordType'],
    createdAt: row.created_at,
  };
  if (row.word_type === 'noun') {
    return {
      ...base,
      wordType: 'noun',
      article: (row.article as Article | null) ?? undefined,
      plural: row.plural ?? undefined,
    };
  }
  if (row.word_type === 'verb') {
    return {
      ...base,
      wordType: 'verb',
      regularity: (row.regularity as VerbRegularity | null) ?? undefined,
      präsens: row.präsens ?? undefined,
      präteritum: row.präteritum ?? undefined,
      perfekt: row.perfekt ?? undefined,
      auxiliary: parseAuxiliaryFlags(row.auxiliary),
    };
  }
  if (row.word_type === 'adjective') {
    return {
      ...base,
      wordType: 'adjective',
      komparativ: row.komparativ ?? undefined,
      superlativ: row.superlativ ?? undefined,
      synonym: row.synonym ?? undefined,
      antonym: row.antonym ?? undefined,
    };
  }
  return { ...base, wordType: 'other' };
}

export const ARTICLE_COLORS: Record<string, string> = {
  der: '#2563eb',
  die: '#dc2626',
  das: '#16a34a',
  'die (pl.)': '#ea580c',
};
