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

export default function AddAdjectiveScreen() {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
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
    const generated = await generateExampleSentences(w, m, 'adjective');
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
        word_type: 'adjective',
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
        <FormInput label="Word" value={word} onChangeText={setWord} placeholder="e.g. gut" />
        <FormInput label="Meaning" value={meaning} onChangeText={setMeaning} placeholder="e.g. good" />
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
              <FormInput label="" value={s} onChangeText={(v) => setSentence(i, v)} placeholder="e.g. Das Wetter ist gut." multiline />
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
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
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
