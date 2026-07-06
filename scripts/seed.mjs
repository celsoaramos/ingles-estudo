/**
 * Seed idempotente do Supabase a partir dos JSONs em supabase/seed/.
 *
 * Uso: npm run seed   (equivale a: node --env-file=.env scripts/seed.mjs)
 *
 * Fontes:
 *   supabase/seed/topics/*.json     -> topics + exercises (source 'seed-v1')
 *   supabase/seed/exercises/*.json  -> exercises extras (source 'gen-v2'); nome do arquivo = topic_id
 *   supabase/seed/decks/*.json      -> flashcard_decks (owner_id null) + flashcards
 *
 * Identidade de exercício: seed_key = `${topicId}:${sha1(pergunta + opções normalizadas)}`.
 * As opções entram no hash porque perguntas genéricas ("Choose the correct
 * sentence:") se repetem — o conteúdo real está nas opções. Editar pergunta OU
 * opções gera uma NOVA linha (tentativas antigas ficam órfãs do filtro "já
 * acertei") — nunca edite questões no Studio, sempre aqui.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Faltam VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env (rode com --env-file=.env).');
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const SEED_DIR = path.resolve(import.meta.dirname, '../supabase/seed');
const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const seedKey = (topicId, ex) =>
  `${topicId}:${sha1([ex.question, ...ex.options].map(normalize).join('|'))}`;

async function readJsonDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async (f) => ({
      file: f,
      data: JSON.parse(await readFile(path.join(dir, f), 'utf8')),
    })),
  );
}

function validateExercise(ex, origin) {
  const problems = [];
  if (typeof ex.question !== 'string' || !ex.question.trim()) problems.push('question vazia');
  if (!Array.isArray(ex.options) || ex.options.length !== 4) problems.push('options deve ter 4 itens');
  if (!Number.isInteger(ex.answer) || ex.answer < 0 || ex.answer > 3) problems.push('answer fora de 0-3');
  if (typeof ex.explanation !== 'string' || !ex.explanation.trim()) problems.push('explanation vazia');
  if (ex.difficulty !== undefined && ![1, 2, 3].includes(ex.difficulty)) problems.push('difficulty deve ser 1-3');
  if (problems.length) throw new Error(`${origin}: ${problems.join('; ')} — ${JSON.stringify(ex.question)}`);
}

async function upsert(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 200), { onConflict });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  }
}

// ---------- topics + exercícios originais ----------
const topicFiles = await readJsonDir(path.join(SEED_DIR, 'topics'));
const topicRows = topicFiles.map(({ data: t }) => ({
  id: t.id,
  title: t.title,
  title_highlight: t.titleHighlight ?? null,
  subtitle: t.subtitle,
  category: t.category,
  tags: t.tags,
  blocks: t.blocks,
  updated_at: new Date().toISOString(),
}));
await upsert('topics', topicRows, 'id');

const exerciseRows = [];
for (const { file, data: t } of topicFiles) {
  for (const ex of t.exercises ?? []) {
    validateExercise(ex, `topics/${file}`);
    exerciseRows.push({
      topic_id: t.id,
      question: ex.question,
      options: ex.options,
      answer: ex.answer,
      explanation: ex.explanation,
      difficulty: ex.difficulty ?? 2,
      source: 'seed-v1',
      seed_key: seedKey(t.id, ex),
    });
  }
}

// ---------- exercícios da expansão ----------
const extraFiles = await readJsonDir(path.join(SEED_DIR, 'exercises'));
const topicIds = new Set(topicFiles.map(({ data }) => data.id));
for (const { file, data: list } of extraFiles) {
  const topicId = file.replace(/\.json$/, '');
  if (!topicIds.has(topicId)) throw new Error(`exercises/${file}: tópico "${topicId}" não existe`);
  for (const ex of list) {
    validateExercise(ex, `exercises/${file}`);
    exerciseRows.push({
      topic_id: topicId,
      question: ex.question,
      options: ex.options,
      answer: ex.answer,
      explanation: ex.explanation,
      difficulty: ex.difficulty ?? 2,
      source: 'gen-v2',
      seed_key: seedKey(topicId, ex),
    });
  }
}

const dupes = exerciseRows.map((r) => r.seed_key).filter((k, i, a) => a.indexOf(k) !== i);
if (dupes.length) throw new Error(`Perguntas duplicadas (mesmo tópico + texto): ${dupes.length}`);
await upsert('exercises', exerciseRows, 'seed_key');

// ---------- flashcard decks ----------
const deckFiles = await readJsonDir(path.join(SEED_DIR, 'decks'));
let cardCount = 0;
for (const { file, data: deck } of deckFiles) {
  if (!deck.slug || !deck.title || !Array.isArray(deck.cards)) {
    throw new Error(`decks/${file}: precisa de slug, title e cards[]`);
  }
  const { data: deckRow, error } = await db
    .from('flashcard_decks')
    .upsert(
      { slug: deck.slug, title: deck.title, description: deck.description ?? '', accent: deck.accent ?? 'blue', owner_id: null },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();
  if (error) throw new Error(`upsert deck ${deck.slug}: ${error.message}`);
  const cardRows = deck.cards.map((c, i) => {
    if (!c.front || !c.back) throw new Error(`decks/${file}: card ${i} sem front/back`);
    return {
      deck_id: deckRow.id,
      front: c.front,
      back: c.back,
      example: c.example ?? null,
      position: i,
      seed_key: `${deck.slug}:${sha1(normalize(c.front))}`,
    };
  });
  await upsert('flashcards', cardRows, 'seed_key');
  cardCount += cardRows.length;
}

// ---------- resumo ----------
const bySource = exerciseRows.reduce((acc, r) => ((acc[r.source] = (acc[r.source] ?? 0) + 1), acc), {});
console.log('Seed concluído:');
console.log(`  topics:     ${topicRows.length}`);
console.log(`  exercises:  ${exerciseRows.length} (${Object.entries(bySource).map(([s, n]) => `${s}: ${n}`).join(', ')})`);
console.log(`  decks:      ${deckFiles.length} (${cardCount} cards)`);
