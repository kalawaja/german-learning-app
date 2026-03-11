import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { WordCard } from '@/components/WordCard';
import { useDatabaseReady } from '@/context/DatabaseContext';
import { getWords, getSentencesByWordId } from '@/lib/database';
import type { WordRow } from '@/lib/database';
import type { SentenceRow } from '@/lib/database';
import type { WordType } from '@/types/word';

const FILTERS: { value: WordType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'noun', label: 'Nouns' },
  { value: 'verb', label: 'Verbs' },
  { value: 'adjective', label: 'Adjectives' },
  { value: 'other', label: 'Other' },
];

export default function WordsScreen() {
  const dbReady = useDatabaseReady();
  const [words, setWords] = useState<WordRow[]>([]);
  const [filter, setFilter] = useState<WordType | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sentencesMap, setSentencesMap] = useState<Record<number, SentenceRow[]>>({});

  const load = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const list = await getWords({
        wordType: filter || undefined,
        search: search.trim() || undefined,
      });
      setWords(list);
      const map: Record<number, SentenceRow[]> = {};
      for (const w of list) {
        map[w.id] = await getSentencesByWordId(w.id);
      }
      setSentencesMap(map);
    } finally {
      setLoading(false);
    }
  }, [dbReady, filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search word or meaning"
          placeholderTextColor="#9ca3af"
        />
        <Pressable style={styles.addBtn} onPress={() => router.push('/add-word')}>
          <Text style={styles.addBtnText}>+ Add</Text>
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
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No words yet. Add one from Home.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <WordCard row={item} sentences={sentencesMap[item.id] ?? []} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRow: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
  },
  addBtn: { justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#0a7ea4', borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
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
  list: { padding: 16, paddingBottom: 32 },
  cardWrap: { marginBottom: 16 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});
