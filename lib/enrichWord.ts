import { getAuxiliaryFromDataset } from '@/lib/verbAuxiliary';
import type { Article, VerbRegularity } from '@/types/word';

export interface EnrichedNounData {
  article?: Article;
  plural?: string;
  meaning?: string;
  exampleSentences?: string[];
}

export interface EnrichedVerbData {
  regularity?: VerbRegularity;
  praesens?: string;
  praeteritum?: string;
  perfekt?: string;
  /** From verb dataset (german-verbs); both flags true when verb can take haben/sein. */
  auxiliary?: { haben: boolean; sein: boolean };
  meaning?: string;
  exampleSentences?: string[];
}

const WIKTIONARY_BASE = 'https://de.wiktionary.org/wiki/';
const WIKTIONARY_API = 'https://de.wiktionary.org/w/api.php';

async function fetchWiktionaryHtml(word: string): Promise<string | null> {
  try {
    const url = `${WIKTIONARY_BASE}${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Fetch page wikitext from MediaWiki API. Returns wikitext string or null. */
async function fetchWikitext(pageTitle: string): Promise<string | null> {
  try {
    const url = `${WIKTIONARY_API}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as { parse?: { wikitext?: { '*': string } } };
    const wikitext = json.parse?.wikitext?.['*'];
    return wikitext ?? null;
  } catch {
    return null;
  }
}

/** Extract template parameters from wikitext. Finds first occurrence of {{TemplateName ... }} and returns key-value map. */
function getTemplateParams(wikitext: string, templateName: string): Map<string, string> {
  const params = new Map<string, string>();
  const escaped = templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = new RegExp(`\\{\\{\\s*${escaped}\\s*\\n`, 'i').exec(wikitext);
  if (!start || start.index === undefined) return params;
  let depth = 0;
  let i = start.index;
  while (i < wikitext.length) {
    if (wikitext.slice(i, i + 2) === '{{') {
      depth++;
      i += 2;
      continue;
    }
    if (wikitext.slice(i, i + 2) === '}}') {
      depth--;
      if (depth === 0) break;
      i += 2;
      continue;
    }
    if (depth === 1 && wikitext[i] === '|') {
      const lineEnd = wikitext.indexOf('\n', i);
      const line = lineEnd === -1 ? wikitext.slice(i + 1) : wikitext.slice(i + 1, lineEnd);
      const eq = line.indexOf('=');
      if (eq > 0) {
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (key && !params.has(key)) params.set(key, value);
      }
      i = lineEnd === -1 ? wikitext.length : lineEnd + 1;
      continue;
    }
    i++;
  }
  return params;
}

/** Map Genus from template to article: m → der, f → die, n → das. */
function genusToArticle(genus: string | undefined): Article | undefined {
  if (!genus) return undefined;
  const g = genus.trim().toLowerCase();
  if (g === 'm') return 'der';
  if (g === 'f') return 'die';
  if (g === 'n') return 'das';
  return undefined;
}

/** Strip article prefix from plural value (e.g. "die Autos" → "Autos"). */
function stripArticleFromPlural(value: string): string {
  return value.replace(/^(der|die|das)\s+/i, '').trim();
}

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

/** Fetch first Turkish translation for a German word via MyMemory API (Bedeutung). */
async function fetchTurkishTranslation(word: string): Promise<string | null> {
  const q = word.trim();
  if (!q) return null;
  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(q)}&langpair=de|tr`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    if (json.responseStatus !== 200) return null;
    const text = json.responseData?.translatedText?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

/** Decode common HTML entities for German quotes. */
function decodeQuoteEntities(s: string): string {
  return s
    .replace(/&#8222;/g, '„')
    .replace(/&#8220;/g, '"')
    .replace(/&bdquo;/g, '„')
    .replace(/&ldquo;/g, '"');
}

/** Remove reference markers [1], [2], [1, 2], quotation marks, and section title from a sentence. */
function cleanExampleSentence(s: string): string {
  return s
    .replace(/\s*\[\d+(?:,\s*\d+)*\]\s*/g, '')
    .replace(/^\s*Beispiele\s*:\s*/i, '')
    .replace(/^[\s„""'"‚]+|[\s„""'"‚]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip HTML tags, JSON fragments, and template/attribute noise from raw Wiktionary content. */
function stripHtmlAndJson(raw: string): string {
  let s = raw;
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/"[\w-]+"\s*:\s*"[^"]*"/g, ' ');
  s = s.replace(/"[\w-]+"\s*:\s*[^,\s}\]]+/g, ' ');
  s = s.replace(/\b(id|href|class|params|data-[a-zA-Z0-9-]+)\s*=\s*"[^"]*"/gi, ' ');
  s = s.replace(/\b(id|href|class|params)\s*=\s*'[^']*'/gi, ' ');
  s = s.replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** True if the string is a clean German example sentence (plain text only). */
function isValidExampleSentence(s: string): boolean {
  if (!s || s.length < 10 || s.length > 200) return false;
  if (/[{}[\]]/.test(s)) return false;
  if (/href\b|params\b|"\s*:\s*|id\s*=\s*|mwTQ|Vorlage|\.\.\//i.test(s)) return false;
  if (s.includes('…') && s.length > 80) return false;
  if (/^[‚'"]/.test(s) && s.includes('—')) return false;
  if (!/^[A-ZÄÖÜ]/.test(s)) return false;
  if (!/[.!?]$/.test(s)) return false;
  const allowed = /^[\w\s.,!?;:„""'‚\-–—()äöüßÄÖÜáàâéèêíìîóòôúùûçığş]+$/;
  return allowed.test(s);
}

/** Find the start of the real "Beispiele" section (heading), not inside JSON/template. */
function findBeispieleSectionStart(html: string): number {
  const idMatch = html.match(/id\s*=\s*["']Beispiele["']/i);
  if (idMatch && idMatch.index !== undefined) return idMatch.index;
  const headingMatch = html.match(/>\s*Beispiele\s*</);
  if (headingMatch && headingMatch.index !== undefined) return headingMatch.index + headingMatch[0].indexOf('Beispiele');
  const colonMatch = html.match(/>\s*Beispiele\s*:\s*</);
  if (colonMatch && colonMatch.index !== undefined) return colonMatch.index + colonMatch[0].indexOf('Beispiele');
  return -1;
}

/** Extract up to max plain-text example sentences from the Beispiele section. No HTML/JSON. */
function extractBeispieleSentences(html: string, max: number = 3): string[] {
  const result: string[] = [];
  const sectionStart = findBeispieleSectionStart(html);
  if (sectionStart === -1) return result;
  const endMarkers = ['Wortbildungen', 'Übersetzungen', 'Referenzen', 'Sinnverwandte', 'Gegenwörter', 'Herkunft'];
  let endIndex = html.length;
  for (const m of endMarkers) {
    const idx = html.indexOf(m, sectionStart + 1);
    if (idx !== -1 && idx < endIndex) endIndex = idx;
  }
  const slice = html.slice(sectionStart, sectionStart + Math.min(5000, endIndex - sectionStart));
  const stripped = stripHtmlAndJson(slice);
  const text = decodeQuoteEntities(stripped);

  const segments = text.split(/\s*\[\d+(?:,\s*\d+)*\]\s*/);
  for (const seg of segments) {
    if (result.length >= max) break;
    const cleaned = cleanExampleSentence(seg);
    if (cleaned && isValidExampleSentence(cleaned)) {
      result.push(cleaned);
    }
  }
  return result;
}

/** Capitalize first letter for Wiktionary (German nouns are capitalized). */
function wiktionaryTitle(word: string): string {
  const w = word.trim();
  if (!w) return '';
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function cleanAdjForm(s: string): string {
  return s.replace(/·/g, '').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const SKIP_WIKI_WORDS = new Set(['Sinnverwandte', 'Wörter', 'Gegenwörter', 'Hilfe', 'Flexion', 'Positiv', 'Komparativ', 'Superlativ', 'Adjektiv', 'Deutsch']);

/** Placeholder/error strings that must never be used as synonym or antonym. */
const INVALID_SYNONYMS_ANTONYMS = new Set(['fehlerhaft', 'undefined', 'null', 'none', 'nicht vorhanden', 'keine', 'unknown', 'error', '']);

function isValidSynonymOrAntonym(s: string | undefined): boolean {
  if (!s || typeof s !== 'string') return false;
  const t = s.trim().toLowerCase();
  if (t.length < 2 || t.length > 40) return false;
  if (INVALID_SYNONYMS_ANTONYMS.has(t)) return false;
  if (/\d|undefined|null|fehlerhaft/i.test(t)) return false;
  return /^[a-zA-ZäöüßÄÖÜ\-]+$/.test(t);
}

/** Em dash / long dash used on Wiktionary when no form is given. */
const WIKTIONARY_EM_DASH = /^[\s\u2014\u2013\-—–]+$/;

/** Extract Komparativ and Superlativ from adjective Wiktionary page. Preserves "—" when shown. */
function extractSteigerung(html: string, baseWord: string): { komparativ?: string; superlativ?: string } {
  const out: { komparativ?: string; superlativ?: string } = {};
  const base = baseWord.toLowerCase();

  const komparativMatch = html.match(/Komparativ\s*:\s*([^<\n,]+?)(?:\s*[<\n,]|$)/i);
  if (komparativMatch) {
    const k = cleanAdjForm(komparativMatch[1]);
    if (k) {
      if (WIKTIONARY_EM_DASH.test(k)) out.komparativ = '—';
      else if (/^[\wäöüß\-]+$/i.test(k) && k.toLowerCase() !== base) out.komparativ = k;
    }
  }
  const superlativMatch = html.match(/Superlativ\s*:\s*([^<\n,]+?)(?:\s*[<\n,]|$)/i);
  if (superlativMatch) {
    const s = cleanAdjForm(superlativMatch[1]);
    if (s) {
      if (WIKTIONARY_EM_DASH.test(s) || s.length < 50) out.superlativ = WIKTIONARY_EM_DASH.test(s) ? '—' : s;
    }
  }
  if (!out.komparativ || !out.superlativ) {
    const tableIdx = html.indexOf('Positiv') !== -1 ? html.indexOf('Positiv') : html.indexOf('Komparativ');
    if (tableIdx !== -1) {
      const slice = html.slice(tableIdx, tableIdx + 1200);
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let m;
      while ((m = cellRegex.exec(slice)) !== null && cells.length < 10) {
        cells.push(cleanAdjForm(m[1]));
      }
      for (let i = 0; i < cells.length - 2; i++) {
        if (cells[i].toLowerCase() === base) {
          const second = cells[i + 1];
          const third = cells[i + 2];
          if (out.komparativ === undefined && second) {
            out.komparativ = WIKTIONARY_EM_DASH.test(second) ? '—' : (/[\wäöüß]/i.test(second) && !SKIP_WIKI_WORDS.has(second) ? second : undefined);
          }
          if (out.superlativ === undefined && third) {
            out.superlativ = WIKTIONARY_EM_DASH.test(third) ? '—' : (third.length < 50 ? third : undefined);
          }
          break;
        }
      }
    }
  }
  return out;
}

/** Extract first synonym from "Sinnverwandte Wörter" or "Synonyme" section. */
function extractFirstSynonym(html: string, baseWord: string): string | undefined {
  const base = baseWord.toLowerCase();
  const extractFromSlice = (slice: string): string | undefined => {
    const all = slice.match(/wiki\/([a-zA-ZäöüßÄÖÜ\-]{2,25})(?=["\?%\s>])/g);
    if (all) {
      for (const m of all) {
        const w = m.replace(/^wiki\//, '').replace(/%[0-9A-F]{2}/gi, '');
        if (!SKIP_WIKI_WORDS.has(w) && w.toLowerCase() !== base) return w;
      }
    }
    const bracketMatch = slice.replace(/<[^>]+>/g, ' ').match(/\]\s*([a-zA-ZäöüßÄÖÜ\-]{2,25})/);
    return bracketMatch && bracketMatch[1].toLowerCase() !== base ? bracketMatch[1] : undefined;
  };
  const synonymeIdx = html.indexOf('Synonyme');
  if (synonymeIdx !== -1) {
    const fromSynonyme = extractFromSlice(html.slice(synonymeIdx, synonymeIdx + 1500));
    if (fromSynonyme) return fromSynonyme;
  }
  const sinnverwandteIdx = html.indexOf('Sinnverwandte');
  if (sinnverwandteIdx !== -1) return extractFromSlice(html.slice(sinnverwandteIdx, sinnverwandteIdx + 1500));
  return undefined;
}

/** Extract first antonym from "Gegenwörter" or "Antonyme" section. One value only; empty if not present. */
function extractFirstAntonym(html: string, baseWord: string): string | undefined {
  const base = baseWord.toLowerCase();
  const extractFromSlice = (slice: string): string | undefined => {
    const all = slice.match(/wiki\/([a-zA-ZäöüßÄÖÜ\-]{2,25})(?=["\?%\s>])/g);
    if (all) {
      for (const m of all) {
        const w = m.replace(/^wiki\//, '').replace(/%[0-9A-F]{2}/gi, '');
        if (!SKIP_WIKI_WORDS.has(w) && w.toLowerCase() !== base) return w;
      }
    }
    const bracketMatch = slice.replace(/<[^>]+>/g, ' ').match(/\]\s*([a-zA-ZäöüßÄÖÜ\-]{2,25})/);
    return bracketMatch && bracketMatch[1].toLowerCase() !== base ? bracketMatch[1] : undefined;
  };
  const antonymeIdx = html.indexOf('Antonyme');
  if (antonymeIdx !== -1) {
    const fromAntonyme = extractFromSlice(html.slice(antonymeIdx, antonymeIdx + 700));
    if (fromAntonyme) return fromAntonyme;
  }
  const gegenwoerterIdx = html.indexOf('Gegenwörter');
  if (gegenwoerterIdx !== -1) return extractFromSlice(html.slice(gegenwoerterIdx, gegenwoerterIdx + 700));
  return undefined;
}

export interface EnrichedAdjectiveData {
  komparativ?: string;
  superlativ?: string;
  synonym?: string;
  antonym?: string;
  meaning?: string;
  exampleSentences?: string[];
}

export async function enrichAdjective(word: string): Promise<EnrichedAdjectiveData> {
  const w = word.trim();
  if (!w) return {};
  const lower = w.toLowerCase();
  const [html, meaning] = await Promise.all([fetchWiktionaryHtml(lower), fetchTurkishTranslation(lower)]);
  if (!html) return {};
  const steigerung = extractSteigerung(html, lower);
  const synonym = extractFirstSynonym(html, lower);
  const antonym = extractFirstAntonym(html, lower);
  const exampleSentences = extractBeispieleSentences(html, 3);
  return {
    ...steigerung,
    synonym: isValidSynonymOrAntonym(synonym) ? synonym : undefined,
    antonym: isValidSynonymOrAntonym(antonym) ? antonym : undefined,
    meaning: meaning ?? undefined,
    exampleSentences: exampleSentences.length > 0 ? exampleSentences : undefined,
  };
}

/** Return only the verb form; strip any leading "ich " (do not include "ich"). */
function onlyVerbForm(s: string): string {
  return s.replace(/^ich\s+/i, '').trim();
}

/** Parse verb regularity from wikitext (e.g. "Verb|Deutsch}}, {{unreg."). */
function extractVerbRegularityFromWikitext(wikitext: string): VerbRegularity | undefined {
  if (/unreg\.|unregelm[äa]ßig|starkes\s+Verb/i.test(wikitext)) return 'unregelmäßig';
  if (/regelm[äa]ßig|schwaches\s+Verb/i.test(wikitext)) return 'regelmäßig';
  return undefined;
}

const NOUN_TEMPLATE = 'Deutsch Substantiv Übersicht';
const VERB_TEMPLATE = 'Deutsch Verb Übersicht';

/**
 * Enrich noun from Wiktionary MediaWiki API. Uses wikitext template "Deutsch Substantiv Übersicht".
 * Genus → article (m→der, f→die, n→das). Nominativ Plural → plural.
 * Example sentences from HTML Beispiele section, same as adjectives.
 */
export async function enrichNoun(word: string): Promise<EnrichedNounData> {
  const w = word.trim();
  if (!w) return {};

  const title = wiktionaryTitle(w);
  const [wikitext, html, meaning] = await Promise.all([
    fetchWikitext(title),
    fetchWiktionaryHtml(title),
    fetchTurkishTranslation(title),
  ]);
  if (!wikitext) return {};

  const params = getTemplateParams(wikitext, NOUN_TEMPLATE);
  const article = genusToArticle(params.get('Genus'));
  const nominativPlural = params.get('Nominativ Plural');
  const pluralRaw = nominativPlural?.trim();
  const plural = pluralRaw ? stripArticleFromPlural(pluralRaw) : undefined;

  const exampleSentences = html ? extractBeispieleSentences(html, 3) : [];

  return {
    article,
    plural: plural && plural.length > 0 ? plural : undefined,
    meaning: meaning ?? undefined,
    exampleSentences: exampleSentences.length > 0 ? exampleSentences : undefined,
  };
}

/**
 * Enrich verb from Wiktionary MediaWiki API. Uses wikitext template "Deutsch Verb Übersicht".
 * Präsens_ich, Präteritum_ich, Partizip II (Perfekt). Auxiliary from german-verbs dataset (not Wiktionary).
 * Example sentences from HTML Beispiele section, same as adjectives.
 */
export async function enrichVerb(word: string): Promise<EnrichedVerbData> {
  const w = word.trim();
  if (!w) return {};

  const infinitive = w.toLowerCase();
  const [wikitext, html, meaning] = await Promise.all([
    fetchWikitext(infinitive),
    fetchWiktionaryHtml(infinitive),
    fetchTurkishTranslation(infinitive),
  ]);
  if (!wikitext) return {};

  const params = getTemplateParams(wikitext, VERB_TEMPLATE);
  const regularity = extractVerbRegularityFromWikitext(wikitext);
  const praesensRaw = params.get('Präsens_ich')?.trim();
  const praesens = praesensRaw ? onlyVerbForm(praesensRaw).replace(/·/g, '') : undefined;
  const praeteritumRaw = params.get('Präteritum_ich')?.trim();
  const praeteritum = praeteritumRaw ? onlyVerbForm(praeteritumRaw).replace(/·/g, '') : undefined;
  const perfektRaw = params.get('Partizip II')?.trim();
  const perfekt = perfektRaw ? perfektRaw.replace(/·/g, '') : undefined;
  const auxiliary = getAuxiliaryFromDataset(infinitive);

  const exampleSentences = html ? extractBeispieleSentences(html, 3) : [];

  return {
    regularity,
    praesens: praesens && praesens.length > 0 ? praesens : undefined,
    praeteritum: praeteritum && praeteritum.length > 0 ? praeteritum : undefined,
    perfekt: perfekt && perfekt.length > 0 ? perfekt : undefined,
    auxiliary,
    meaning: meaning ?? undefined,
    exampleSentences: exampleSentences.length > 0 ? exampleSentences : undefined,
  };
}

export interface EnrichedOtherData {
  meaning?: string;
  exampleSentences?: string[];
}

/** Fetch Turkish meaning (MyMemory) and example sentences (Wiktionary) for any word (other, etc.). */
export async function enrichFromWiktionary(word: string): Promise<EnrichedOtherData> {
  const w = word.trim();
  if (!w) return {};
  const title = wiktionaryTitle(w);
  const [meaning, html] = await Promise.all([fetchTurkishTranslation(title), fetchWiktionaryHtml(title)]);
  const exampleSentences = html ? extractBeispieleSentences(html, 3) : [];
  return {
    meaning: meaning ?? undefined,
    exampleSentences: exampleSentences.length > 0 ? exampleSentences : undefined,
  };
}

