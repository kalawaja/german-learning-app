/**
 * Auxiliary (Hilfsverb) from German verb dataset.
 * Uses german-verbs (alwaysUsesSein) and a list of verbs that can take both haben and sein.
 */

import { alwaysUsesSein } from 'german-verbs';

export interface AuxiliaryFlags {
  haben: boolean;
  sein: boolean;
}

/** Verbs that can use either haben or sein depending on context (transitive/intransitive, region). Set both flags true. */
const VERBS_WITH_HABEN_OR_SEIN = new Set([
  'stehen',
  'liegen',
  'sitzen',
  'hängen',
  'biegen',
  'brechen',
  'reißen',
  'reiten',
  'schwimmen',
  'treten',
  'verderben',
  'ziehen',
  'erschrecken',
  'fahren', // often listed as both in resources (e.g. "ich bin gefahren" / "er hat den Wagen gefahren")
]);

/**
 * Get auxiliary flags from the German verb dataset (german-verbs).
 * If the verb can use "haben/sein" (either), both flags are true.
 * Otherwise: sein-only from alwaysUsesSein, default haben.
 */
export function getAuxiliaryFromDataset(verb: string): AuxiliaryFlags | undefined {
  const v = verb.trim().toLowerCase();
  if (!v) return undefined;

  if (VERBS_WITH_HABEN_OR_SEIN.has(v)) {
    return { haben: true, sein: true };
  }
  if (alwaysUsesSein(v)) {
    return { haben: false, sein: true };
  }
  return { haben: true, sein: false };
}
