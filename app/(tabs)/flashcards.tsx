import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { WordCard } from '@/components/WordCard';
import { useDatabaseReady } from '@/context/DatabaseContext';
import { getAllWordsWithReviews, getSentencesByWordId } from '@/lib/database';
import type { WordRow, SentenceRow } from '@/lib/database';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export default function FlashcardsScreen() {
  const dbReady = useDatabaseReady();
  const [words, setWords] = useState<WordRow[]>([]);
  const [sentencesMap, setSentencesMap] = useState<Record<number, SentenceRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    if (!dbReady) return;
    setLoading(true);
    try {
      const list = await getAllWordsWithReviews();
      setWords(list);
      const map: Record<number, SentenceRow[]> = {};
      for (const w of list) {
        map[w.id] = await getSentencesByWordId(w.id);
      }
      setSentencesMap(map);
      setFlipped({});
    } finally {
      setLoading(false);
    }
  }, [dbReady]);

  // Refresh whenever this tab gains focus (e.g., after adding a word).
  useFocusEffect(
    useCallback(() => {
      load();
      return undefined;
    }, [load])
  );

  const toggleFlip = (id: number) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {words.length} Lernkarte{words.length !== 1 ? 'n' : ''}
        </Text>
        <Pressable onPress={() => router.push('/add-word')}>
          <Text style={styles.addLink}>+ Wort hinzufügen</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : words.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Noch keine Lernkarten.</Text>
          <Text style={styles.emptySub}>Jedes gespeicherte Wort wird eine Karte. Füge Wörter über die Startseite hinzu.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/add-word')}>
            <Text style={styles.emptyBtnText}>+ Wort hinzufügen</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.cardContainer}
              onPress={() => toggleFlip(item.id)}
            >
              <View style={styles.cardInner}>
                {!flipped[item.id] ? (
                  <View style={styles.front}>
                    <Text style={styles.frontWord}>{item.word}</Text>
                    <Text style={styles.tapHint}>Tippen zum Umblättern</Text>
                  </View>
                ) : (
                  <View style={styles.back}>
                    <WordCard row={item} sentences={sentencesMap[item.id] ?? []} compact />
                    {sentencesMap[item.id]?.[0]?.sentence ? (
                      <Text style={styles.firstSentence}>
                        {sentencesMap[item.id]?.[0]?.sentence}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  addLink: { fontSize: 14, color: '#0a7ea4', fontWeight: '600' },
  list: { paddingVertical: 24, paddingHorizontal: 24 },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: 24,
    flex: 1,
    minHeight: 280,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    justifyContent: 'center',
  },
  front: { alignItems: 'center' },
  frontWord: { fontSize: 28, fontWeight: '700', color: '#111' },
  tapHint: { marginTop: 12, fontSize: 14, color: '#9ca3af' },
  back: { flex: 1 },
  firstSentence: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  empty: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#0a7ea4', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
