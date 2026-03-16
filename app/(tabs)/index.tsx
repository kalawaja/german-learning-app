import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDatabaseReady } from '@/context/DatabaseContext';

export default function HomeScreen() {
  const dbReady = useDatabaseReady();

  const handleAddWord = () => {
    router.push('/add-word');
  };

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Laden…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Deutsch Vokabeln</Text>
        <Text style={styles.subtitle}>Wörter hinzufügen und mit Karteikarten wiederholen.</Text>
        <Pressable style={styles.addButton} onPress={handleAddWord}>
          <Text style={styles.addButtonText}>+ Wort hinzufügen</Text>
        </Pressable>
        <View style={styles.quickLinks}>
          <Pressable style={styles.link} onPress={() => router.push('/(tabs)/words')}>
            <Text style={styles.linkText}>Wörter</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={() => router.push('/(tabs)/flashcards')}>
            <Text style={styles.linkText}>Lernkarten</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={() => router.push('/(tabs)/review')}>
            <Text style={styles.linkText}>Wiederholen</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});
