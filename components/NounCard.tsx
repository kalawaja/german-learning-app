import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ARTICLE_COLORS } from '@/lib/wordUtils';
import type { NounWord } from '@/types/word';
import type { SentenceRow } from '@/lib/database';

interface NounCardProps {
  word: NounWord;
  sentences?: SentenceRow[];
  compact?: boolean;
}

export function NounCard({ word, sentences = [], compact }: NounCardProps) {
  const articleColor = word.article === 'die' && word.plural ? ARTICLE_COLORS['die (pl.)'] : (word.article ? ARTICLE_COLORS[word.article] : undefined) ?? '#6b7280';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {(word.article != null && word.article !== '') && (
        <View style={[styles.articleBadge, { backgroundColor: articleColor }]}>
          <Text style={styles.articleText}>{word.article}</Text>
        </View>
      )}
      <Text style={styles.word}>{word.word}</Text>
      {word.plural ? (
        <Text style={styles.plural}>Plural: {word.plural}</Text>
      ) : null}
      <Text style={styles.meaning}>{word.meaning}</Text>
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
  articleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  articleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  word: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  plural: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  meaning: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
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
