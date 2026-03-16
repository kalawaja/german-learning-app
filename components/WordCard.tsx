import React from 'react';

import type { WordRow, SentenceRow } from '@/lib/database';
import { wordRowToWord } from '@/lib/wordUtils';
import { AdjectiveCard } from '@/components/AdjectiveCard';
import { NounCard } from '@/components/NounCard';
import { OtherCard } from '@/components/OtherCard';
import { VerbCard } from '@/components/VerbCard';

interface WordCardProps {
  row: WordRow;
  sentences?: SentenceRow[];
  compact?: boolean;
}

export function WordCard({ row, sentences = [], compact }: WordCardProps) {
  const word = wordRowToWord(row);

  switch (word.wordType) {
    case 'noun':
      return <NounCard word={word} sentences={sentences} compact={compact} />;
    case 'verb':
      return <VerbCard word={word} auxiliary={word.auxiliary} sentences={sentences} compact={compact} />;
    case 'adjective':
      return <AdjectiveCard word={word} sentences={sentences} compact={compact} />;
    case 'other':
      return <OtherCard word={word} sentences={sentences} compact={compact} />;
    default:
      return <OtherCard word={word as import('@/types/word').OtherWord} sentences={sentences} compact={compact} />;
  }
}
