import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { WordCard } from '@/components/WordCard';
import { useDatabaseReady } from '@/context/DatabaseContext';
import {
  getAllWords,
  getSentencesByWordId,
  upsertReview,
  createReviewForWord,
} from '@/lib/database';
import type { WordRow, SentenceRow } from '@/lib/database';
import type { WordType } from '@/types/word';

const FILTERS: { value: WordType | ''; label: string }[] = [
  { value: '', label: 'Alle' },
  { value: 'noun', label: 'Nomen' },
  { value: 'verb', label: 'Verben' },
  { value: 'adjective', label: 'Adjektive' },
  { value: 'other', label: 'Sonstige' },
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ReviewScreen() {
  const dbReady = useDatabaseReady();
  const [words, setWords] = useState<WordRow[]>([]);
  const [sentencesMap, setSentencesMap] = useState<Record<number, SentenceRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WordType | ''>('');
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [randomized, setRandomized] = useState(false);

  const load = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const list = await getAllWords();
      const map: Record<number, SentenceRow[]> = {};
      for (const w of list) {
        map[w.id] = await getSentencesByWordId(w.id);
      }
      setSentencesMap(map);
      setWords(list);
      setFlipped({});
    } finally {
      setLoading(false);
    }
  }, [dbReady]);

  useFocusEffect(
    useCallback(() => {
      load();
      return undefined;
    }, [load])
  );

  const filtered = useMemo(() => {
    let list = filter ? words.filter((w) => w.word_type === filter) : words;
    if (randomized) list = shuffle(list);
    return list;
  }, [words, filter, randomized]);

  const markKnown = useCallback(
    async (wordId: number) => {
      await createReviewForWord(wordId);
      await upsertReview(wordId, 14);
    },
    []
  );

  const markUnknown = useCallback(
    async (wordId: number) => {
      await createReviewForWord(wordId);
      await upsertReview(wordId, 1);
    },
    []
  );

  const toggleFlip = useCallback((id: number) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (loading && words.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.done}>
          <Text style={styles.doneTitle}>Noch keine Wörter</Text>
          <Text style={styles.doneText}>Füge Wörter über die Startseite oder Wörter hinzu, um sie hier zu üben.</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/add-word')}>
            <Text style={styles.addBtnText}>+ Wort hinzufügen</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {filtered.length} Wort{filtered.length !== 1 ? 'e' : ''}
        </Text>
        <Pressable
          style={[styles.toggleBtn, randomized && styles.toggleBtnActive]}
          onPress={() => setRandomized((r) => !r)}
        >
          <Text style={[styles.toggleBtnText, randomized && styles.toggleBtnTextActive]}>Zufällig</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.value || 'all'}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <Pressable onPress={() => toggleFlip(item.id)}>
              {!flipped[item.id] ? (
                <View style={styles.card}>
                  <Text style={styles.frontWord}>{item.word}</Text>
                  <Text style={styles.tapHint}>Tippen für Bedeutung und Beispiele</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  <WordCard row={item} sentences={(sentencesMap[item.id] ?? []).slice(0, 3)} />
                </View>
              )}
            </Pressable>
            <View style={styles.actions}>
              <Pressable style={styles.knownBtn} onPress={() => markKnown(item.id)}>
                <Text style={styles.knownBtnText}>Gewusst</Text>
              </Pressable>
              <Pressable style={styles.unknownBtn} onPress={() => markUnknown(item.id)}>
                <Text style={styles.unknownBtnText}>Nicht gewusst</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  toggleBtnActive: { backgroundColor: '#0a7ea4' },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  toggleBtnTextActive: { color: '#fff' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: { backgroundColor: '#0a7ea4' },
  filterText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 48 },
  cardWrap: { marginBottom: 20 },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
  },
  frontWord: { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center' },
  tapHint: { marginTop: 8, fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  knownBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
  },
  knownBtnText: { fontSize: 15, fontWeight: '600', color: '#15803d' },
  unknownBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
  },
  unknownBtnText: { fontSize: 15, fontWeight: '600', color: '#b91c1c' },
  done: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 },
  doneText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: '#0a7ea4', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
