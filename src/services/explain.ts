import type { Exercise } from '../domain/types';
import { supabase } from '../lib/supabase';

export interface ExplanationExample {
  en: string;
  pt: string;
}

export interface Explanation {
  /** Por que a alternativa correta é a certa (didático). */
  explanation: string;
  /** Por que as outras enganam (pode ser vazio). */
  commonMistakes: string;
  examples: ExplanationExample[];
  /** Macete/regra prática (pode ser vazio). */
  tip: string;
}

export interface ExplainResult {
  content: Explanation;
  cached: boolean;
}

/**
 * Consulta a Edge Function `explain` (cache por exercício, OpenAI gpt-5-mini).
 * Só funciona logado — a função retorna 401 para anônimos.
 */
export async function explainExercise(ex: Exercise): Promise<ExplainResult> {
  const { data, error } = await supabase.functions.invoke('explain', {
    body: {
      exerciseId: ex.id,
      question: ex.question,
      options: ex.options,
      answer: ex.answer,
    },
  });

  if (error) {
    // FunctionsHttpError carrega a resposta original com a mensagem em PT
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.json();
        if (body?.error?.message) throw new Error(body.error.message);
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.includes('JSON')) {
          throw e;
        }
      }
    }
    throw new Error('Explicação indisponível no momento. Tente novamente.');
  }
  return data as ExplainResult;
}
