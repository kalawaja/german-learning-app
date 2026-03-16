import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormInput } from '@/components/FormInput';
import {
  getWordById,
  getSentencesByWordId,
  insertWord,
  updateWord,
  deleteSentencesByWordId,
  createReviewForWord,
  insertSentence,
} from '@/lib/database';
import { enrichNoun } from '@/lib/enrichWord';
import type { Article } from '@/types/word';

const ARTICLES: Article[] = ['der', 'die', 'das'];

export default function AddNounScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? parseInt(params.id, 10) : null;
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [article, setArticle] = useState<Article | undefined>(undefined);
  const [plural, setPlural] = useState('');
  const [sentences, setSentences] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lastLookupRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editId || loaded) return;
    let cancelled = false;
    (async () => {
      const row = await getWordById(editId);
      const sents = await getSentencesByWordId(editId);
      if (!cancelled && row && row.word_type === 'noun') {
        setWord(row.word);
        setMeaning(row.meaning);
        setArticle((row.article as Article) ?? 'der');
        setPlural(row.plural ?? '');
        setSentences(sents.length ? sents.map((s) => s.sentence) : ['']);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, loaded]);

  const addSentence = () => setSentences((s) => [...s, '']);
  const setSentence = (i: number, v: string) =>
    setSentences((s) => {
      const n = [...s];
      n[i] = v;
      return n;
    });
  const removeSentence = (i: number) =>
    setSentences((s) => s.filter((_, idx) => idx !== i));

  // Auto-fill all fields except Bedeutung from Wiktionary (skip when editing).
  useEffect(() => {
    if (editId) return;
    const w = word.trim();
    if (!w) return;
    const lower = w.toLowerCase();
    const timeout = setTimeout(() => {
      if (lastLookupRef.current === lower) return;
      lastLookupRef.current = lower;
      enrichNoun(w).then((data) => {
        if (data.article !== undefined) setArticle(data.article);
        if (data.plural !== undefined) setPlural(data.plural);
        if (data.meaning !== undefined) setMeaning(data.meaning);
        if (data.exampleSentences?.length) setSentences(data.exampleSentences);
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [editId, word]);

  const save = async () => {
    const w = word.trim();
    if (!w) {
      Alert.alert('Fehlende Angaben', 'Bitte mindestens das Wort eingeben.');
      return;
    }
    const m = meaning.trim();
    if (!m) {
      Alert.alert('Fehlende Angaben', 'Bitte Wort und Bedeutung eingeben.');
      return;
    }
    setSaving(true);
    try {
      const art = article ?? null;
      const pl = plural.trim();
      const sentencesToInsert = sentences.map((s) => s.trim()).filter(Boolean);
      if (editId) {
        await updateWord(editId, {
          word: w,
          meaning: m,
          word_type: 'noun',
          article: art,
          plural: pl || undefined,
        });
        await deleteSentencesByWordId(editId);
        for (let i = 0; i < sentencesToInsert.length; i++) {
          await insertSentence(editId, sentencesToInsert[i], i);
        }
      } else {
        const id = await insertWord({
          word: w,
          meaning: m,
          word_type: 'noun',
          article: art,
          plural: pl || undefined,
        });
        for (let i = 0; i < sentencesToInsert.length; i++) {
          await insertSentence(id, sentencesToInsert[i], i);
        }
        await createReviewForWord(id);
      }
      router.back();
    } catch {
      Alert.alert('Fehler', 'Wort konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <FormInput label="Wort" value={word} onChangeText={setWord} placeholder="z. B. Buch" />
        <FormInput label="Bedeutung" value={meaning} onChangeText={setMeaning} placeholder="Bedeutung eingeben" />
        <View style={styles.wrap}>
          <Text style={styles.label}>Artikel</Text>
          <View style={styles.articleRow}>
            {ARTICLES.map((a) => (
              <Pressable
                key={a}
                style={[styles.articleBtn, article === a && styles.articleBtnActive]}
                onPress={() => setArticle(a)}
              >
                <Text style={[styles.articleText, article === a && styles.articleTextActive]}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <FormInput label="Plural (optional)" value={plural} onChangeText={setPlural} placeholder="z. B. Bücher" />
        <View style={styles.wrap}>
          <View style={styles.sentenceHeader}>
            <Text style={styles.label}>Beispielsätze (optional)</Text>
            <Pressable onPress={addSentence}>
              <Text style={styles.addSentence}>+ Hinzufügen</Text>
            </Pressable>
          </View>
          {sentences.map((s, i) => (
            <View key={i} style={styles.sentenceRow}>
              <FormInput
                label=""
                value={s}
                onChangeText={(v) => setSentence(i, v)}
                placeholder="z. B. Das Buch ist gut."
                multiline
              />
              {sentences.length > 1 && (
                <Pressable onPress={() => removeSentence(i)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Entfernen</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Speichern…' : 'Speichern'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  wrap: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  articleRow: { flexDirection: 'row', gap: 12 },
  articleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  articleBtnActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  articleText: { fontSize: 16, color: '#374151', fontWeight: '600' },
  articleTextActive: { color: '#fff' },
  sentenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addSentence: { fontSize: 14, color: '#0a7ea4', fontWeight: '600' },
  sentenceRow: { marginBottom: 12 },
  removeBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  removeText: { fontSize: 14, color: '#dc2626' },
  saveBtn: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
