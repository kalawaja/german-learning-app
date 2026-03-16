import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { enrichFromWiktionary } from '@/lib/enrichWord';

export default function AddOtherScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? parseInt(params.id, 10) : null;
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [sentences, setSentences] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!editId || loaded) return;
    let cancelled = false;
    (async () => {
      const row = await getWordById(editId);
      const sents = await getSentencesByWordId(editId);
      if (!cancelled && row && row.word_type === 'other') {
        setWord(row.word);
        setMeaning(row.meaning);
        setSentences(sents.length ? sents.map((s) => s.sentence) : ['']);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, loaded]);

  useEffect(() => {
    if (editId) return;
    const w = word.trim();
    if (!w) return;
    const t = setTimeout(() => {
      enrichFromWiktionary(w).then((data) => {
        if (data.meaning && !meaning) setMeaning(data.meaning);
        if (data.exampleSentences?.length && sentences.join('').trim().length === 0) {
          setSentences(data.exampleSentences);
        }
      });
    }, 500);
    return () => clearTimeout(t);
  }, [editId, word, meaning, sentences]);

  const addSentence = () => setSentences((s) => [...s, '']);
  const setSentence = (i: number, v: string) =>
    setSentences((s) => {
      const n = [...s];
      n[i] = v;
      return n;
    });
  const removeSentence = (i: number) => setSentences((s) => s.filter((_, idx) => idx !== i));

  const save = async () => {
    const w = word.trim();
    const m = meaning.trim();
    if (!w || !m) {
      Alert.alert('Fehlende Angaben', 'Bitte Wort und Bedeutung eingeben.');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateWord(editId, {
          word: w,
          meaning: m,
          word_type: 'other',
        });
        await deleteSentencesByWordId(editId);
        const toInsert = sentences.map((s) => s.trim()).filter(Boolean);
        for (let i = 0; i < toInsert.length; i++) {
          await insertSentence(editId, toInsert[i], i);
        }
      } else {
        const id = await insertWord({
          word: w,
          meaning: m,
          word_type: 'other',
        });
        const toInsert = sentences.map((s) => s.trim()).filter(Boolean);
        for (let i = 0; i < toInsert.length; i++) {
          await insertSentence(id, toInsert[i], i);
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
        <FormInput label="Word" value={word} onChangeText={setWord} placeholder="e.g. heute" />
        <FormInput label="Meaning" value={meaning} onChangeText={setMeaning} placeholder="e.g. today" />
        <View style={styles.wrap}>
          <View style={styles.sentenceHeader}>
            <Text style={styles.label}>Beispielsätze (optional)</Text>
            <Pressable onPress={addSentence}>
              <Text style={styles.addSentence}>+ Add</Text>
            </Pressable>
          </View>
          {sentences.map((s, i) => (
            <View key={i} style={styles.sentenceRow}>
              <FormInput label="" value={s} onChangeText={(v) => setSentence(i, v)} placeholder="z. B. Heute ist Montag." multiline />
              {sentences.length > 1 && (
                <Pressable onPress={() => removeSentence(i)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
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
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  sentenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addSentence: { fontSize: 14, color: '#0a7ea4', fontWeight: '600' },
  sentenceRow: { marginBottom: 12 },
  removeBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  removeText: { fontSize: 14, color: '#dc2626' },
  saveBtn: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
