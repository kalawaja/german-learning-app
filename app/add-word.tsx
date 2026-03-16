import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { WordType } from '@/types/word';

const WORD_TYPES: { type: WordType; label: string }[] = [
  { type: 'noun', label: 'Nomen' },
  { type: 'verb', label: 'Verb' },
  { type: 'adjective', label: 'Adjektiv' },
];

export default function AddWordTypeScreen() {
  const select = (type: WordType) => {
    router.replace(`/add-${type}` as '/add-noun');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wort hinzufügen</Text>
        <Text style={styles.subtitle}>Wortart wählen</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {WORD_TYPES.map(({ type, label }) => (
          <Pressable
            key={type}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => select(type)}
          >
            <Text style={styles.optionText}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 12,
  },
  option: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionPressed: {
    backgroundColor: '#f3f4f6',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
});
