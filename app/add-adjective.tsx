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
import { enrichAdjective } from '@/lib/enrichWord';

export default function AddAdjectiveScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? parseInt(params.id, 10) : null;
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [komparativ, setKomparativ] = useState('');
  const [superlativ, setSuperlativ] = useState('');
  const [synonym, setSynonym] = useState('');
  const [antonym, setAntonym] = useState('');
  const [sentences, setSentences] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!editId || loaded) return;
    let cancelled = false;
    (async () => {
      const row = await getWordById(editId);
      const sents = await getSentencesByWordId(editId);
      if (!cancelled && row && row.word_type === 'adjective') {
        setWord(row.word);
        setMeaning(row.meaning);
        setKomparativ(row.komparativ ?? '');
        setSuperlativ(row.superlativ ?? '');
        setSynonym(row.synonym ?? '');
        setAntonym(row.antonym ?? '');
        setSentences(sents.length ? sents.map((s) => s.sentence) : ['']);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, loaded]);

  // Auto-fill from Wiktionary + MyMemory (Bedeutung = Turkish translation).
  useEffect(() => {
    if (editId) return;
    const w = word.trim();
    if (!w) return;
    const t = setTimeout(() => {
      enrichAdjective(w).then((data) => {
        if (data.komparativ !== undefined) setKomparativ(data.komparativ);
        if (data.superlativ !== undefined) setSuperlativ(data.superlativ);
        if (data.synonym !== undefined) setSynonym(data.synonym);
        if (data.antonym !== undefined) setAntonym(data.antonym);
        if (data.meaning !== undefined) setMeaning(data.meaning);
        if (data.exampleSentences?.length) setSentences(data.exampleSentences);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [editId, word]);

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
    if (!w) {
      Alert.alert('Fehlende Angaben', 'Bitte mindestens das Wort eingeben.');
      return;
    }
    setSaving(true);
    try {
      let m = meaning.trim();
      let k = komparativ.trim();
      let s = superlativ.trim();
      let syn = synonym.trim();
      let ant = antonym.trim();
      let sentencesToInsert = sentences.map((s) => s.trim()).filter(Boolean);
      if (!m) {
        const data = await enrichAdjective(w);
        m = data.meaning ?? m;
        if (!k) k = data.komparativ ?? k;
        if (!s) s = data.superlativ ?? s;
        if (!syn) syn = data.synonym ?? syn;
        if (!ant) ant = data.antonym ?? ant;
        if (data.exampleSentences?.length && sentencesToInsert.length === 0) {
          sentencesToInsert = data.exampleSentences;
        }
      }
      if (!m) {
        Alert.alert('Fehlende Angaben', 'Bitte Bedeutung eingeben oder warten, bis sie geladen wurde.');
        setSaving(false);
        return;
      }
      const toInsert = sentencesToInsert;
      if (editId) {
        await updateWord(editId, {
          word: w,
          meaning: m,
          word_type: 'adjective',
          komparativ: k || null,
          superlativ: s || null,
          synonym: syn || null,
          antonym: ant || null,
        });
        await deleteSentencesByWordId(editId);
        for (let i = 0; i < toInsert.length; i++) {
          await insertSentence(editId, toInsert[i], i);
        }
      } else {
        const id = await insertWord({
          word: w,
          meaning: m,
          word_type: 'adjective',
          komparativ: k || undefined,
          superlativ: s || undefined,
          synonym: syn || undefined,
          antonym: ant || undefined,
        });
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
        <FormInput label="Wort (Positiv)" value={word} onChangeText={setWord} placeholder="z. B. schnell" />
        <FormInput label="Bedeutung" value={meaning} onChangeText={setMeaning} placeholder="z. B. hızlı (Türkisch)" />
        <FormInput label="Komparativ (optional)" value={komparativ} onChangeText={setKomparativ} placeholder="z. B. schneller" />
        <FormInput label="Superlativ (optional)" value={superlativ} onChangeText={setSuperlativ} placeholder="z. B. am schnellsten" />
        <FormInput label="Synonym (optional)" value={synonym} onChangeText={setSynonym} placeholder="z. B. rasch" />
        <FormInput label="Gegenwort (optional)" value={antonym} onChangeText={setAntonym} placeholder="z. B. langsam" />
        <View style={styles.wrap}>
          <View style={styles.sentenceHeader}>
            <Text style={styles.label}>Beispielsätze (optional)</Text>
            <Pressable onPress={addSentence}>
              <Text style={styles.addSentence}>+ Hinzufügen</Text>
            </Pressable>
          </View>
          {sentences.map((s, i) => (
            <View key={i} style={styles.sentenceRow}>
              <FormInput label="" value={s} onChangeText={(v) => setSentence(i, v)} placeholder="z. B. Das Wetter ist gut." multiline />
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
