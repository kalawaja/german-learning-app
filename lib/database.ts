import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('german_vocab.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      word_type TEXT NOT NULL CHECK(word_type IN ('noun','verb','adjective','other')),
      article TEXT,
      plural TEXT,
      regularity TEXT,
      präsens TEXT,
      präteritum TEXT,
      perfekt TEXT,
      auxiliary TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      sentence TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL UNIQUE,
      next_review_at TEXT NOT NULL,
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      repetitions INTEGER DEFAULT 0,
      last_reviewed_at TEXT,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_words_type ON words(word_type);
    CREATE INDEX IF NOT EXISTS idx_sentences_word ON sentences(word_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_next ON reviews(next_review_at);
  `);
  await addAdjectiveColumnsIfNeeded(database);
}

async function addAdjectiveColumnsIfNeeded(database: SQLite.SQLiteDatabase): Promise<void> {
  const columns = ['komparativ', 'superlativ', 'synonym', 'antonym'];
  for (const col of columns) {
    try {
      await database.runAsync(`ALTER TABLE words ADD COLUMN ${col} TEXT`);
    } catch {
      // Column already exists (e.g. duplicate column name)
    }
  }
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// --- Words ---

export async function insertWord(row: {
  word: string;
  meaning: string;
  word_type: string;
  article?: string;
  plural?: string;
  regularity?: string;
  präsens?: string;
  präteritum?: string;
  perfekt?: string;
  auxiliary?: string;
  komparativ?: string;
  superlativ?: string;
  synonym?: string;
  antonym?: string;
}): Promise<number> {
  const database = getDb();
  const result = await database.runAsync(
    `INSERT INTO words (word, meaning, word_type, article, plural, regularity, präsens, präteritum, perfekt, auxiliary, komparativ, superlativ, synonym, antonym)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.word,
      row.meaning,
      row.word_type,
      row.article ?? null,
      row.plural ?? null,
      row.regularity ?? null,
      row.präsens ?? null,
      row.präteritum ?? null,
      row.perfekt ?? null,
      row.auxiliary ?? null,
      row.komparativ ?? null,
      row.superlativ ?? null,
      row.synonym ?? null,
      row.antonym ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function getWords(filters?: { wordType?: string; search?: string }): Promise<WordRow[]> {
  const database = getDb();
  let sql = 'SELECT * FROM words WHERE 1=1';
  const params: (string | number)[] = [];
  if (filters?.wordType) {
    sql += ' AND word_type = ?';
    params.push(filters.wordType);
  }
  if (filters?.search?.trim()) {
    sql += ' AND (word LIKE ? OR meaning LIKE ?)';
    const term = `%${filters.search.trim()}%`;
    params.push(term, term);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = await database.getAllAsync<WordRow>(sql, params);
  return rows;
}

export interface WordRow {
  id: number;
  word: string;
  meaning: string;
  word_type: string;
  article: string | null;
  plural: string | null;
  regularity: string | null;
  präsens: string | null;
  präteritum: string | null;
  perfekt: string | null;
  auxiliary: string | null;
  komparativ?: string | null;
  superlativ?: string | null;
  synonym?: string | null;
  antonym?: string | null;
  created_at: string;
}

export async function getWordById(id: number): Promise<WordRow | null> {
  const database = getDb();
  const rows = await database.getAllAsync<WordRow>('SELECT * FROM words WHERE id = ?', [id]);
  return rows[0] ?? null;
}

export async function updateWord(
  id: number,
  row: {
    word: string;
    meaning: string;
    word_type: string;
    article?: string | null;
    plural?: string | null;
    regularity?: string | null;
    präsens?: string | null;
    präteritum?: string | null;
    perfekt?: string | null;
    auxiliary?: string | null;
    komparativ?: string | null;
    superlativ?: string | null;
    synonym?: string | null;
    antonym?: string | null;
  }
): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `UPDATE words SET word = ?, meaning = ?, word_type = ?, article = ?, plural = ?, regularity = ?, präsens = ?, präteritum = ?, perfekt = ?, auxiliary = ?, komparativ = ?, superlativ = ?, synonym = ?, antonym = ? WHERE id = ?`,
    [
      row.word,
      row.meaning,
      row.word_type,
      row.article ?? null,
      row.plural ?? null,
      row.regularity ?? null,
      row.präsens ?? null,
      row.präteritum ?? null,
      row.perfekt ?? null,
      row.auxiliary ?? null,
      row.komparativ ?? null,
      row.superlativ ?? null,
      row.synonym ?? null,
      row.antonym ?? null,
      id,
    ]
  );
}

export async function deleteWord(id: number): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM words WHERE id = ?', [id]);
}

export async function deleteSentencesByWordId(wordId: number): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM sentences WHERE word_id = ?', [wordId]);
}

// --- Sentences ---

export async function getSentencesByWordId(wordId: number): Promise<SentenceRow[]> {
  const database = getDb();
  return database.getAllAsync<SentenceRow>(
    'SELECT * FROM sentences WHERE word_id = ? ORDER BY sort_order, id',
    [wordId]
  );
}

export interface SentenceRow {
  id: number;
  word_id: number;
  sentence: string;
  sort_order: number;
}

export async function insertSentence(wordId: number, sentence: string, sortOrder: number = 0): Promise<number> {
  const database = getDb();
  const result = await database.runAsync(
    'INSERT INTO sentences (word_id, sentence, sort_order) VALUES (?, ?, ?)',
    [wordId, sentence, sortOrder]
  );
  return result.lastInsertRowId;
}

export async function deleteSentence(id: number): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM sentences WHERE id = ?', [id]);
}

// --- Reviews (spaced repetition) ---

export async function getReviewByWordId(wordId: number): Promise<ReviewRow | null> {
  const database = getDb();
  const rows = await database.getAllAsync<ReviewRow>('SELECT * FROM reviews WHERE word_id = ?', [wordId]);
  return rows[0] ?? null;
}

export interface ReviewRow {
  id: number;
  word_id: number;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
}

export async function upsertReview(
  wordId: number,
  intervalDays: number,
  options?: { easeFactor?: number; repetitions?: number }
): Promise<void> {
  const database = getDb();
  const now = new Date().toISOString();
  const next = new Date();
  next.setDate(next.getDate() + intervalDays);
  const nextStr = next.toISOString();
  const ease = options?.easeFactor ?? 2.5;
  const reps = options?.repetitions ?? 0;

  const existing = await getReviewByWordId(wordId);
  if (existing) {
    await database.runAsync(
      `UPDATE reviews SET next_review_at = ?, interval_days = ?, ease_factor = ?, repetitions = ?, last_reviewed_at = ? WHERE word_id = ?`,
      [nextStr, intervalDays, ease, reps + 1, now, wordId]
    );
  } else {
    await database.runAsync(
      `INSERT INTO reviews (word_id, next_review_at, interval_days, ease_factor, repetitions, last_reviewed_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [wordId, nextStr, intervalDays, ease, reps, now]
    );
  }
}

export async function getWordsDueForReview(limit: number = 50): Promise<WordRow[]> {
  const database = getDb();
  const now = new Date().toISOString();
  const words = await database.getAllAsync<WordRow>(
    `SELECT w.* FROM words w
     INNER JOIN reviews r ON r.word_id = w.id
     WHERE r.next_review_at <= ?
     ORDER BY r.next_review_at
     LIMIT ?`,
    [now, limit]
  );
  return words;
}

export async function getWordsWithReviewsDue(): Promise<{ word: WordRow; review: ReviewRow }[]> {
  const database = getDb();
  const now = new Date().toISOString();
  const reviews = await database.getAllAsync<ReviewRow>(
    `SELECT * FROM reviews WHERE next_review_at <= ? ORDER BY next_review_at`,
    [now]
  );
  const result: { word: WordRow; review: ReviewRow }[] = [];
  for (const review of reviews) {
    const word = await getWordById(review.word_id);
    if (word) result.push({ word, review });
  }
  return result;
}

export async function createReviewForWord(wordId: number): Promise<void> {
  const existing = await getReviewByWordId(wordId);
  if (existing) return;
  await upsertReview(wordId, 1, { repetitions: 0 });
}

export async function getAllWordsWithReviews(): Promise<WordRow[]> {
  const database = getDb();
  return database.getAllAsync<WordRow>(
    `SELECT w.* FROM words w INNER JOIN reviews r ON r.word_id = w.id ORDER BY w.created_at DESC`
  );
}

export async function getAllWords(): Promise<WordRow[]> {
  const database = getDb();
  return database.getAllAsync<WordRow>('SELECT * FROM words ORDER BY created_at DESC');
}
