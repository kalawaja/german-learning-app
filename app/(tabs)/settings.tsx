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
        <Text style={styles.sectionTitle}>Über</Text>
        <Text style={styles.body}>
          Deutsch Vokabeln — eine einfache App zum Lernen und Wiederholen deutscher Wörter mit Karteikarten.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>So funktioniert es</Text>
        <Text style={styles.body}>
          • Wörter (Nomen, Verben, Adjektive, Sonstiges) mit optionalen Beispielsätzen hinzufügen.{'\n'}
          • Jedes Wort wird eine Lernkarte. Unter Lernkarten kannst du umblättern und wiederholen.{'\n'}
          • Beim Wiederholen bewerten: Nochmal (1d), Schwer (3d), Gut (7d), Einfach (14d).
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daten</Text>
        <Text style={styles.body}>
          Alle Daten werden nur auf deinem Gerät (SQLite) gespeichert. Nichts wird an Server gesendet.
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
