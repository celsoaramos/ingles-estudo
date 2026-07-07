// Explicação didática de uma questão, sob demanda, com cache por exercício.
// Fluxo: exige usuário logado -> cache em explanation_cache (chave = exercise_id)
// -> OpenAI gpt-5-mini (structured outputs, JSON garantido) -> grava no cache.
// Como a chave é o exercício, a IA roda no máximo uma vez por questão.
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

// Schema em modo strict da OpenAI: additionalProperties:false e tudo em required.
const EXPLAIN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['explanation', 'commonMistakes', 'examples', 'tip'],
  properties: {
    explanation: { type: 'string' },
    commonMistakes: { type: 'string' },
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
    tip: { type: 'string' },
  },
} as const;

const SYSTEM_PROMPT = `Você é um professor de inglês paciente, explicando para estudantes brasileiros em português claro.
Recebe uma questão de múltipla escolha, as alternativas e qual é a correta. Produza uma explicação didática:
- explanation: por que a alternativa correta é a certa, na prática, em linguagem simples (2 a 4 frases). Pode usar **negrito** para destacar termos.
- commonMistakes: por que as outras alternativas enganam / o erro comum que elas representam (1 a 3 frases). Se não houver pegadinha relevante, string vazia.
- examples: exatamente 2 exemplos NOVOS (não repita a frase da questão) que ilustram a regra — frase natural em inglês + tradução natural em PT-BR.
- tip: uma regra prática ou macete curto para lembrar (1 frase). Se não houver, string vazia.
Seja direto e encorajador. Não invente regras incorretas.`;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: { code: 'method_not_allowed', message: 'Use POST.' } }, 405);
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 0. exige usuário logado (recurso exclusivo de quem tem conta)
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData } = await db.auth.getUser(token);
  if (!userData?.user) {
    return json(
      { error: { code: 'unauthorized', message: 'Entre na sua conta para usar a explicação com IA.' } },
      401,
    );
  }

  let exerciseId: string;
  let question: string;
  let options: string[];
  let answer: number;
  try {
    const body = await req.json();
    exerciseId = String(body.exerciseId ?? '');
    question = String(body.question ?? '').trim();
    options = Array.isArray(body.options) ? body.options.map(String) : [];
    answer = Number(body.answer);
  } catch {
    return json({ error: { code: 'invalid_body', message: 'Corpo inválido.' } }, 400);
  }

  if (
    !UUID_PATTERN.test(exerciseId) ||
    !question ||
    options.length < 2 ||
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer >= options.length
  ) {
    return json({ error: { code: 'invalid_input', message: 'Dados da questão inválidos.' } }, 400);
  }

  // 1. cache (chave = exercício)
  const { data: cached } = await db
    .from('explanation_cache')
    .select('content, lookup_count')
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (cached) {
    void db
      .from('explanation_cache')
      .update({ lookup_count: (cached.lookup_count ?? 1) + 1 })
      .eq('exercise_id', exerciseId)
      .then(() => {});
    return json({ content: cached.content, cached: true });
  }

  // 2. modelo (OpenAI, structured outputs em modo strict)
  let content: unknown;
  try {
    const optionsList = options
      .map((o, i) => `${i === answer ? '[correta] ' : ''}${o}`)
      .join('\n');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: 'minimal',
        max_completion_tokens: 2000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Questão: ${question}\n\nAlternativas:\n${optionsList}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'exercise_explanation',
            strict: true,
            schema: EXPLAIN_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      if (res.status === 429 || res.status === 503) {
        return json(
          { error: { code: 'upstream_busy', message: 'IA ocupada. Tente de novo em instantes.' } },
          503,
        );
      }
      console.error('openai error:', res.status, await res.text());
      return json(
        { error: { code: 'upstream_error', message: 'Explicação indisponível no momento. Tente novamente.' } },
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
    content = JSON.parse(choice.message.content);
  } catch (err) {
    console.error('openai request failed:', err);
    return json(
      { error: { code: 'upstream_error', message: 'Explicação indisponível no momento. Tente novamente.' } },
      502,
    );
  }

  // 3. grava no cache (corridas são inofensivas)
  const { error: cacheErr } = await db
    .from('explanation_cache')
    .upsert({ exercise_id: exerciseId, content, model: MODEL }, { onConflict: 'exercise_id', ignoreDuplicates: true });
  if (cacheErr) console.error('cache upsert:', cacheErr.message);

  return json({ content, cached: false });
});
