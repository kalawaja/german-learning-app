import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>
          German Vocabulary — a minimalist app to learn and review German words with spaced repetition.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <Text style={styles.body}>
          • Add words (nouns, verbs, adjectives, other) with optional example sentences.{'\n'}
          • Each word becomes a flashcard. Use the Flashcards tab to flip and review.{'\n'}
          • Words are scheduled for review. Use the Review tab and rate: Again (1d), Hard (3d), Good (7d), Easy (14d).
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <Text style={styles.body}>
          All data is stored locally on your device using SQLite. Nothing is sent to any server.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 10 },
  body: { fontSize: 15, color: '#374151', lineHeight: 24 },
});
