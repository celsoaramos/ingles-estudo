// Dicionário EN↔PT com cache.
// Fluxo: valida termo curto -> cache em dictionary_cache -> OpenAI gpt-5-mini
// (structured outputs, JSON garantido) -> grava no cache -> responde.
// Segredos: OPENAI_API_KEY (supabase secrets set); SUPABASE_URL e
// SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente pela plataforma.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = 'gpt-5-mini';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Schema em modo strict da OpenAI: todo objeto precisa de additionalProperties:false
// e de todas as chaves em required.
const DICTIONARY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['term', 'found', 'entries', 'collocations', 'note'],
  properties: {
    term: { type: 'string' },
    found: { type: 'boolean' },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['translation', 'partOfSpeech', 'sense', 'examples'],
        properties: {
          translation: { type: 'string' },
          partOfSpeech: { type: 'string' },
          sense: { type: 'string' },
          examples: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['en', 'pt'],
              properties: {
                en: { type: 'string' },
                pt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    collocations: { type: 'array', items: { type: 'string' } },
    note: { type: ['string', 'null'] },
  },
} as const;

const SYSTEM_PROMPT = `Você é um dicionário bilíngue inglês ↔ português brasileiro para estudantes de inglês.
Dada uma palavra ou expressão curta, produza um verbete de dicionário:
- Cada sentido relevante (máximo 4) como uma entrada: tradução, classe gramatical em português (substantivo, verbo, adjetivo, advérbio, expressão, phrasal verb...), contexto de uso curto (sense) e exatamente 2 exemplos por sentido (frase natural em inglês + tradução natural em PT-BR).
- collocations: 2 a 5 combinações comuns com o termo (em inglês).
- note: se for falso cognato, tiver pronúncia traiçoeira ou pegadinha comum para brasileiros, uma nota curta em PT-BR; senão null.
- Se o termo não existir em nenhum dos dois idiomas, retorne found=false com entries e collocations vazios.
Direção en-pt: o termo é inglês, traduza para português. Direção pt-en: o termo é português, as "translations" são as palavras em inglês e os exemplos continuam sendo frase em inglês + tradução PT-BR.`;

function normalizeTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

const TERM_PATTERN = /^[a-zà-öø-ÿ' -]{1,60}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: { code: 'method_not_allowed', message: 'Use POST.' } }, 405);
  }

  let term: string;
  let direction: string;
  try {
    const body = await req.json();
    term = normalizeTerm(String(body.term ?? ''));
    direction = String(body.direction ?? 'en-pt');
  } catch {
    return json({ error: { code: 'invalid_body', message: 'Corpo inválido.' } }, 400);
  }

  if (direction !== 'en-pt' && direction !== 'pt-en') {
    return json({ error: { code: 'invalid_direction', message: 'Direção inválida.' } }, 400);
  }
  if (!TERM_PATTERN.test(term) || term.split(' ').length > 4) {
    return json(
      {
        error: {
          code: 'invalid_term',
          message:
            'Isto é um dicionário, não um tradutor 🙂 Busque uma palavra ou expressão curta (até 4 palavras, só letras).',
        },
      },
      400,
    );
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. cache
  const { data: cached } = await db
    .from('dictionary_cache')
    .select('entry, lookup_count')
    .eq('term', term)
    .eq('direction', direction)
    .maybeSingle();

  if (cached) {
    // contagem de uso é melhor-esforço; não bloqueia a resposta
    void db
      .from('dictionary_cache')
      .update({ lookup_count: (cached.lookup_count ?? 1) + 1 })
      .eq('term', term)
      .eq('direction', direction)
      .then(() => {});
    return json({ entry: cached.entry, cached: true });
  }

  // 2. modelo (OpenAI, structured outputs em modo strict)
  let entry: unknown;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        // tarefa simples e estruturada: raciocínio mínimo = mais rápido e barato
        reasoning_effort: 'minimal',
        max_completion_tokens: 2000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Termo: "${term}" (direção: ${direction === 'en-pt' ? 'inglês → português' : 'português → inglês'})`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'dictionary_entry',
            strict: true,
            schema: DICTIONARY_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      if (res.status === 429 || res.status === 503) {
        return json(
          { error: { code: 'upstream_busy', message: 'Dicionário ocupado. Tente de novo em instantes.' } },
          503,
        );
      }
      console.error('openai error:', res.status, await res.text());
      return json(
        { error: { code: 'upstream_error', message: 'Dicionário indisponível no momento. Tente novamente.' } },
        502,
      );
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice || choice.finish_reason === 'length' || !choice.message?.content) {
      return json(
        { error: { code: 'upstream_error', message: 'Resposta incompleta. Tente novamente.' } },
        502,
      );
    }
    entry = JSON.parse(choice.message.content);
  } catch (err) {
    console.error('openai request failed:', err);
    return json(
      { error: { code: 'upstream_error', message: 'Dicionário indisponível no momento. Tente novamente.' } },
      502,
    );
  }

  // 3. grava no cache (corridas são inofensivas)
  const { error: cacheErr } = await db.from('dictionary_cache').upsert(
    { term, direction, entry, model: MODEL },
    { onConflict: 'term,direction', ignoreDuplicates: true },
  );
  if (cacheErr) console.error('cache upsert:', cacheErr.message);

  return json({ entry, cached: false });
});
