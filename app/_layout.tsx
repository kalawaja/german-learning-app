import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/context/DatabaseContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-word" options={{ presentation: 'modal', title: 'Wort hinzufügen', headerShown: true }} />
          <Stack.Screen name="add-noun" options={{ title: 'Add Noun', headerShown: true }} />
          <Stack.Screen name="add-verb" options={{ title: 'Verb hinzufügen', headerShown: true }} />
          <Stack.Screen name="add-adjective" options={{ title: 'Adjektiv hinzufügen', headerShown: true }} />
          <Stack.Screen name="add-other" options={{ title: 'Wort hinzufügen', headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </DatabaseProvider>
    </ThemeProvider>
  );
}
