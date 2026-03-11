/**
 * Optional: Generate 5 example sentences using AI when adding a word.
 * To enable: integrate an API (e.g. OpenAI) and call it with word + meaning + type.
 * Store API key in environment or secure storage; do not commit keys.
 */

export type WordTypeForAI = 'noun' | 'verb' | 'adjective' | 'other';

export async function generateExampleSentences(
  _word: string,
  _meaning: string,
  _wordType: WordTypeForAI
): Promise<string[]> {
  // TODO: e.g. OpenAI completion with prompt:
  // "Generate 5 short German example sentences using the word \"{word}\" ({meaning}). Return one per line."
  return [];
}
