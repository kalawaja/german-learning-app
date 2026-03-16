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
import { enrichVerb } from '@/lib/enrichWord';
import { parseAuxiliaryFlags, serializeAuxiliaryFlags } from '@/lib/wordUtils';
import type { AuxiliaryFlags, VerbRegularity } from '@/types/word';

const REGULARITY: VerbRegularity[] = ['regelmäßig', 'unregelmäßig'];
const AUX_OPTIONS: ('haben' | 'sein')[] = ['haben', 'sein'];

function toggleAuxiliaryFlag(prev: AuxiliaryFlags | undefined, option: 'haben' | 'sein'): AuxiliaryFlags {
  const current = prev ?? { haben: false, sein: false };
  if (option === 'haben') return { ...current, haben: !current.haben };
  return { ...current, sein: !current.sein };
}

export default function AddVerbScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? parseInt(params.id, 10) : null;
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [regularity, setRegularity] = useState<VerbRegularity | undefined>(undefined);
  const [präsens, setPräsens] = useState('');
  const [präteritum, setPräteritum] = useState('');
  const [perfekt, setPerfekt] = useState('');
  const [auxiliary, setAuxiliary] = useState<AuxiliaryFlags | undefined>(undefined);
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
      if (!cancelled && row && row.word_type === 'verb') {
        setWord(row.word);
        setMeaning(row.meaning);
        setRegularity((row.regularity as VerbRegularity) ?? undefined);
        setPräsens(row.präsens ?? '');
        setPräteritum(row.präteritum ?? '');
        setPerfekt(row.perfekt ?? '');
        setAuxiliary(parseAuxiliaryFlags(row.auxiliary) ?? undefined);
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
  const removeSentence = (i: number) => setSentences((s) => s.filter((_, idx) => idx !== i));

  // Auto-fill all fields except Bedeutung from Wiktionary (skip when editing).
  useEffect(() => {
    if (editId) return;
    const w = word.trim();
    if (!w) return;
    const lower = w.toLowerCase();
    const timeout = setTimeout(() => {
      if (lastLookupRef.current === lower) return;
      lastLookupRef.current = lower;
      enrichVerb(w).then((data) => {
        if (data.regularity !== undefined) setRegularity(data.regularity);
        if (data.praesens !== undefined) setPräsens(data.praesens);
        if (data.praeteritum !== undefined) setPräteritum(data.praeteritum);
        if (data.perfekt !== undefined) setPerfekt(data.perfekt);
        if (data.auxiliary !== undefined) setAuxiliary(data.auxiliary);
        if (data.meaning !== undefined) setMeaning(data.meaning);
        if (data.exampleSentences?.length) setSentences(data.exampleSentences);
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [editId, word]);

  const save = async () => {
    const w = word.trim();
    const m = meaning.trim();
    if (!w || !m) {
      Alert.alert('Fehlende Angaben', 'Bitte Wort und Bedeutung eingeben.');
      return;
    }
    setSaving(true);
    try {
      const reg = regularity;
      const pr = präsens.trim();
      const pt = präteritum.trim();
      const pf = perfekt.trim();
      const auxStr = serializeAuxiliaryFlags(auxiliary);
      const sentencesToInsert = sentences.map((s) => s.trim()).filter(Boolean);
      if (editId) {
        await updateWord(editId, {
          word: w,
          meaning: m,
          word_type: 'verb',
          regularity: reg,
          präsens: pr || undefined,
          präteritum: pt || undefined,
          perfekt: pf || undefined,
          auxiliary: auxStr,
        });
        await deleteSentencesByWordId(editId);
        for (let i = 0; i < sentencesToInsert.length; i++) {
          await insertSentence(editId, sentencesToInsert[i], i);
        }
      } else {
        const id = await insertWord({
          word: w,
          meaning: m,
          word_type: 'verb',
          regularity: reg,
          präsens: pr || undefined,
          präteritum: pt || undefined,
          perfekt: pf || undefined,
          auxiliary: auxStr,
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
        <FormInput label="Wort (Infinitiv)" value={word} onChangeText={setWord} placeholder="z. B. gehen" />
        <FormInput label="Bedeutung" value={meaning} onChangeText={setMeaning} placeholder="Bedeutung eingeben" />
        <View style={styles.wrap}>
          <Text style={styles.label}>Regularität</Text>
          <View style={styles.row}>
            {REGULARITY.map((r) => (
              <Pressable
                key={r}
                style={[styles.optionBtn, regularity === r && styles.optionBtnActive]}
                onPress={() => setRegularity(r)}
              >
                <Text style={[styles.optionText, regularity === r && styles.optionTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <FormInput label="Präsens (z. B. ich gehe)" value={präsens} onChangeText={setPräsens} placeholder="optional" />
        <FormInput label="Präteritum (z. B. ich ging)" value={präteritum} onChangeText={setPräteritum} placeholder="optional" />
        <FormInput label="Perfekt (z. B. ich bin gegangen)" value={perfekt} onChangeText={setPerfekt} placeholder="optional" />
        <View style={styles.wrap}>
          <Text style={styles.label}>Hilfsverb (mehrfach wählbar)</Text>
          <View style={styles.articleRow}>
            {AUX_OPTIONS.map((option) => {
              const isActive = option === 'haben' ? (auxiliary?.haben ?? false) : (auxiliary?.sein ?? false);
              return (
                <Pressable
                  key={option}
                  style={[styles.articleBtn, isActive && styles.articleBtnActive]}
                  onPress={() => setAuxiliary(toggleAuxiliaryFlag(auxiliary, option))}
                >
                  <Text style={[styles.articleText, isActive && styles.articleTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.wrap}>
          <View style={styles.sentenceHeader}>
            <Text style={styles.label}>Beispielsätze (optional)</Text>
            <Pressable onPress={addSentence}>
              <Text style={styles.addSentence}>+ Hinzufügen</Text>
            </Pressable>
          </View>
          {sentences.map((s, i) => (
            <View key={i} style={styles.sentenceRow}>
              <FormInput label="" value={s} onChangeText={(v) => setSentence(i, v)} placeholder="z. B. Ich gehe nach Hause." multiline />
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
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 12 },
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
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  optionBtnActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  optionText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  optionTextActive: { color: '#fff' },
  sentenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addSentence: { fontSize: 14, color: '#0a7ea4', fontWeight: '600' },
  sentenceRow: { marginBottom: 12 },
  removeBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  removeText: { fontSize: 14, color: '#dc2626' },
  saveBtn: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
