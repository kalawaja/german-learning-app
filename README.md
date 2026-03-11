# German Vocabulary Learning App

A minimalist German vocabulary app for iOS and Android built with **React Native**, **Expo**, **TypeScript**, and **SQLite**.

## Features

- **Word types**: Nouns, Verbs, Adjectives, Others — filter by type
- **Noun cards**: Article (der/die/das) and plural; color-coded (der=blue, die=red, das=green, die plural=orange); example sentences; meaning
- **Verb cards**: Regularity (regelmäßig / unregelmäßig), transparent green/red background; conjugations (Präsens, Präteritum, Perfekt, auxiliary); example sentences; meaning
- **Adjective & Other cards**: Word, meaning, optional example sentences
- **Add Word flow**: Home → "+ Add Word" → choose type → fill form → optional example sentences
- **Flashcards**: Every saved word becomes a flashcard; front = word, back = meaning + grammar + examples
- **Spaced repetition (Review)**: Again (1d), Hard (3d), Good (7d), Easy (14d)
- **Word list**: Filter by type, search by word or meaning
- **Minimalist UI**: White background, simple typography, fast entry
- **Navigation**: Home, Words, Flashcards, Review, Settings
- **Database**: SQLite (Words, Sentences, Reviews) with relations
- **Optional**: "Generate 5 (AI)" placeholder for AI-generated example sentences (wire your API in `lib/aiSentences.ts`)

## Run the app

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npx expo start
   ```

3. Open on device/simulator (Expo Go, or iOS/Android simulator from the terminal menu).

Use the local Expo CLI only (`npx expo start`); do not use a global deprecated `expo-cli`.

## Project structure

- **`app/`** — Screens (expo-router): tabs (Home, Words, Flashcards, Review, Settings), add-word flow (add-word → add-noun/verb/adjective/other)
- **`components/`** — NounCard, VerbCard, AdjectiveCard, OtherCard, WordCard, FormInput
- **`lib/`** — `database.ts` (SQLite schema + CRUD), `wordUtils.ts` (row → Word, colors), `aiSentences.ts` (optional AI stub)
- **`types/word.ts`** — Word types (Noun, Verb, Adjective, Other, Sentence, Review)
- **`context/DatabaseContext.tsx`** — DB init and ready state

All data is stored locally with SQLite; nothing is sent to a server.
