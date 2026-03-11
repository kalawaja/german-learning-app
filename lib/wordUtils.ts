import type { WordRow } from '@/lib/database';
import type { Word } from '@/types/word';

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
      article: (row.article as 'der' | 'die' | 'das') ?? 'der',
      plural: row.plural ?? '',
    };
  }
  if (row.word_type === 'verb') {
    return {
      ...base,
      wordType: 'verb',
      regularity: (row.regularity as 'regelmäßig' | 'unregelmäßig') ?? 'regelmäßig',
      präsens: row.präsens ?? '',
      präteritum: row.präteritum ?? '',
      perfekt: row.perfekt ?? '',
      auxiliary: (row.auxiliary as 'haben' | 'sein') ?? 'haben',
    };
  }
  if (row.word_type === 'adjective') {
    return { ...base, wordType: 'adjective' };
  }
  return { ...base, wordType: 'other' };
}

export const ARTICLE_COLORS: Record<string, string> = {
  der: '#2563eb',
  die: '#dc2626',
  das: '#16a34a',
  'die (pl.)': '#ea580c',
};
