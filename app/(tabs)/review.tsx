import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { WordCard } from '@/components/WordCard';
import { useDatabaseReady } from '@/context/DatabaseContext';
import {
  getWordsWithReviewsDue,
  getSentencesByWordId,
  upsertReview,
} from '@/lib/database';
import type { WordRow } from '@/lib/database';
import type { SentenceRow } from '@/lib/database';

const INTERVALS = [
  { label: 'Again', days: 1 },
  { label: 'Hard', days: 3 },
  { label: 'Good', days: 7 },
  { label: 'Easy', days: 14 },
];

export default function ReviewScreen() {
  const dbReady = useDatabaseReady();
  const [due, setDue] = useState<{ word: WordRow; review: import('@/lib/database').ReviewRow }[]>([]);
  const [sentencesMap, setSentencesMap] = useState<Record<number, SentenceRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const load = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const list = await getWordsWithReviewsDue();
      setDue(list);
      const map: Record<number, SentenceRow[]> = {};
      for (const { word } of list) {
        map[word.id] = await getSentencesByWordId(word.id);
      }
      setSentencesMap(map);
      setIndex(0);
      setShowBack(false);
    } finally {
      setLoading(false);
    }
  }, [dbReady]);

  useEffect(() => {
    load();
  }, [load]);

  const current = due[index];
  const rate = async (days: number) => {
    if (!current) return;
    await upsertReview(current.word.id, days);
    if (index >= due.length - 1) {
      await load();
    } else {
      setIndex((i) => i + 1);
      setShowBack(false);
    }
  };

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (loading && due.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (due.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.done}>
          <Text style={styles.doneTitle}>All caught up</Text>
          <Text style={styles.doneText}>No words due for review. Add more words and they will appear here.</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/add-word')}>
            <Text style={styles.addBtnText}>+ Add Word</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {index + 1} / {due.length}
        </Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setShowBack((b) => !b)}>
          {!showBack ? (
            <View style={styles.card}>
              <Text style={styles.frontWord}>{current.word.word}</Text>
              <Text style={styles.tapHint}>Tap to show answer</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <WordCard row={current.word} sentences={sentencesMap[current.word.id] ?? []} />
            </View>
          )}
        </Pressable>
        {showBack && (
          <View style={styles.buttons}>
            {INTERVALS.map(({ label, days }) => (
              <Pressable
                key={label}
                style={[styles.rateBtn, label === 'Again' && styles.rateAgain, label === 'Easy' && styles.rateEasy]}
                onPress={() => rate(days)}
              >
                <Text style={styles.rateBtnText}>{label}</Text>
                <Text style={styles.rateBtnSub}>{days}d</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progress: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  progressText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    marginBottom: 24,
  },
  frontWord: { fontSize: 26, fontWeight: '700', color: '#111', textAlign: 'center' },
  tapHint: { marginTop: 12, fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  rateBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    minWidth: 72,
    alignItems: 'center',
  },
  rateAgain: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  rateEasy: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  rateBtnText: { fontSize: 15, fontWeight: '600', color: '#111' },
  rateBtnSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  done: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 },
  doneText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: '#0a7ea4', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
