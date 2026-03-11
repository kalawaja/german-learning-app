import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { insertWord, createReviewForWord, insertSentence } from '@/lib/database';
import { generateExampleSentences } from '@/lib/aiSentences';
import type { Auxiliary, VerbRegularity } from '@/types/word';

const REGULARITY: VerbRegularity[] = ['regelmäßig', 'unregelmäßig'];
const AUX: Auxiliary[] = ['haben', 'sein'];

export default function AddVerbScreen() {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [regularity, setRegularity] = useState<VerbRegularity>('regelmäßig');
  const [präsens, setPräsens] = useState('');
  const [präteritum, setPräteritum] = useState('');
  const [perfekt, setPerfekt] = useState('');
  const [auxiliary, setAuxiliary] = useState<Auxiliary>('haben');
  const [sentences, setSentences] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);

  const addSentence = () => setSentences((s) => [...s, '']);
  const setSentence = (i: number, v: string) =>
    setSentences((s) => {
      const n = [...s];
      n[i] = v;
      return n;
    });
  const removeSentence = (i: number) => setSentences((s) => s.filter((_, idx) => idx !== i));

  const generateWithAI = async () => {
    const w = word.trim();
    const m = meaning.trim();
    if (!w || !m) return;
    const generated = await generateExampleSentences(w, m, 'verb');
    if (generated.length > 0) setSentences(generated);
  };

  const save = async () => {
    const w = word.trim();
    const m = meaning.trim();
    if (!w || !m) {
      Alert.alert('Missing fields', 'Please enter word and meaning.');
      return;
    }
    setSaving(true);
    try {
      const id = await insertWord({
        word: w,
        meaning: m,
        word_type: 'verb',
        regularity,
        präsens: präsens.trim() || undefined,
        präteritum: präteritum.trim() || undefined,
        perfekt: perfekt.trim() || undefined,
        auxiliary,
      });
      const toInsert = sentences.map((s) => s.trim()).filter(Boolean);
      for (let i = 0; i < toInsert.length; i++) {
        await insertSentence(id, toInsert[i], i);
      }
      await createReviewForWord(id);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save word.');
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
        <FormInput label="Word (infinitive)" value={word} onChangeText={setWord} placeholder="e.g. gehen" />
        <FormInput label="Meaning" value={meaning} onChangeText={setMeaning} placeholder="e.g. to go" />
        <View style={styles.wrap}>
          <Text style={styles.label}>Regularity</Text>
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
        <FormInput label="Präsens (e.g. ich gehe)" value={präsens} onChangeText={setPräsens} placeholder="optional" />
        <FormInput label="Präteritum (e.g. ich ging)" value={präteritum} onChangeText={setPräteritum} placeholder="optional" />
        <FormInput label="Perfekt (e.g. ich bin gegangen)" value={perfekt} onChangeText={setPerfekt} placeholder="optional" />
        <View style={styles.wrap}>
          <Text style={styles.label}>Auxiliary</Text>
          <View style={styles.row}>
            {AUX.map((a) => (
              <Pressable
                key={a}
                style={[styles.optionBtn, auxiliary === a && styles.optionBtnActive]}
                onPress={() => setAuxiliary(a)}
              >
                <Text style={[styles.optionText, auxiliary === a && styles.optionTextActive]}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.wrap}>
          <View style={styles.sentenceHeader}>
            <Text style={styles.label}>Example sentences (optional)</Text>
            <View style={styles.sentenceActions}>
              <Pressable onPress={generateWithAI}>
                <Text style={styles.aiButton}>Generate 5 (AI)</Text>
              </Pressable>
              <Pressable onPress={addSentence}>
                <Text style={styles.addSentence}>+ Add</Text>
              </Pressable>
            </View>
          </View>
          {sentences.map((s, i) => (
            <View key={i} style={styles.sentenceRow}>
              <FormInput label="" value={s} onChangeText={(v) => setSentence(i, v)} placeholder="e.g. Ich gehe nach Hause." multiline />
              {sentences.length > 1 && (
                <Pressable onPress={() => removeSentence(i)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
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
  sentenceHeader: { marginBottom: 8 },
  sentenceActions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  addSentence: { fontSize: 14, color: '#0a7ea4', fontWeight: '600' },
  aiButton: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  sentenceRow: { marginBottom: 12 },
  removeBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  removeText: { fontSize: 14, color: '#dc2626' },
  saveBtn: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
