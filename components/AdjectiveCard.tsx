import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AdjectiveWord } from '@/types/word';
import type { SentenceRow } from '@/lib/database';

interface AdjectiveCardProps {
  word: AdjectiveWord;
  sentences?: SentenceRow[];
  compact?: boolean;
}

export function AdjectiveCard({ word, sentences = [], compact }: AdjectiveCardProps) {
  const hasForms = word.komparativ || word.superlativ || word.synonym || word.antonym;
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.word}>{word.word}</Text>
      <Text style={styles.meaning}>{word.meaning}</Text>
      {hasForms && !compact && (
        <View style={styles.forms}>
          {word.komparativ ? <Text style={styles.formLine}>Komparativ: {word.komparativ}</Text> : null}
          {word.superlativ ? <Text style={styles.formLine}>Superlativ: {word.superlativ}</Text> : null}
          {word.synonym ? <Text style={styles.formLine}>Synonym: {word.synonym}</Text> : null}
          {word.antonym ? <Text style={styles.formLine}>Gegenwort: {word.antonym}</Text> : null}
        </View>
      )}
      {sentences.length > 0 && !compact && (
        <View style={styles.sentences}>
          {sentences.map((s) => (
            <Text key={s.id} style={styles.sentence}>• {s.sentence}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardCompact: {
    padding: 12,
  },
  word: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  meaning: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  forms: {
    marginBottom: 8,
    paddingTop: 4,
  },
  formLine: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  sentences: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  sentence: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
});
