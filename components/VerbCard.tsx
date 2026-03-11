import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VerbWord } from '@/types/word';
import type { SentenceRow } from '@/lib/database';

interface VerbCardProps {
  word: VerbWord;
  sentences?: SentenceRow[];
  compact?: boolean;
}

export function VerbCard({ word, sentences = [], compact }: VerbCardProps) {
  const isRegular = word.regularity === 'regelmäßig';
  const bgColor = isRegular ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';

  return (
    <View style={[styles.card, { backgroundColor: bgColor }, compact && styles.cardCompact]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{word.regularity}</Text>
      </View>
      <Text style={styles.word}>{word.word}</Text>
      <Text style={styles.meaning}>{word.meaning}</Text>
      {!compact && (
        <>
          <View style={styles.grammar}>
            <Text style={styles.grammarLabel}>Präsens:</Text>
            <Text style={styles.grammarValue}>{word.präsens || '—'}</Text>
          </View>
          <View style={styles.grammar}>
            <Text style={styles.grammarLabel}>Präteritum:</Text>
            <Text style={styles.grammarValue}>{word.präteritum || '—'}</Text>
          </View>
          <View style={styles.grammar}>
            <Text style={styles.grammarLabel}>Perfekt:</Text>
            <Text style={styles.grammarValue}>{word.perfekt || '—'} ({word.auxiliary})</Text>
          </View>
          {sentences.length > 0 && (
            <View style={styles.sentences}>
              {sentences.map((s) => (
                <Text key={s.id} style={styles.sentence}>• {s.sentence}</Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardCompact: {
    padding: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  word: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  meaning: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  grammar: {
    marginBottom: 6,
  },
  grammarLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  grammarValue: {
    fontSize: 14,
    color: '#111',
  },
  sentences: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  sentence: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
});
