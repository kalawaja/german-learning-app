export type WordType = 'noun' | 'verb' | 'adjective' | 'other';

export type Article = 'der' | 'die' | 'das';

export type VerbRegularity = 'regelmäßig' | 'unregelmäßig';

export type Auxiliary = 'haben' | 'sein';

export interface Conjugation {
  person: string;
  form: string;
}

export interface WordBase {
  id: number;
  word: string;
  meaning: string;
  wordType: WordType;
  createdAt: string;
}

export interface NounWord extends WordBase {
  wordType: 'noun';
  article: Article;
  plural: string;
}

export interface VerbWord extends WordBase {
  wordType: 'verb';
  regularity: VerbRegularity;
  präsens: string;
  präteritum: string;
  perfekt: string;
  auxiliary: Auxiliary;
}

export interface AdjectiveWord extends WordBase {
  wordType: 'adjective';
}

export interface OtherWord extends WordBase {
  wordType: 'other';
}

export type Word = NounWord | VerbWord | AdjectiveWord | OtherWord;

export interface Sentence {
  id: number;
  wordId: number;
  sentence: string;
  sortOrder: number;
}

export interface Review {
  id: number;
  wordId: number;
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lastReviewedAt: string | null;
}

export type WordWithSentences = Word & { sentences: Sentence[] };

export type WordWithReview = WordWithSentences & { review: Review | null };
