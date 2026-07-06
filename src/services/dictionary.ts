import { supabase } from '../lib/supabase';

export type Direction = 'en-pt' | 'pt-en';

export interface DictionaryExample {
  en: string;
  pt: string;
}

export interface DictionarySense {
  translation: string;
  partOfSpeech: string;
  sense: string;
  examples: DictionaryExample[];
}

export interface DictionaryEntry {
  term: string;
  found: boolean;
  entries: DictionarySense[];
  collocations: string[];
  note: string | null;
}

export interface LookupResult {
  entry: DictionaryEntry;
  cached: boolean;
}

/** Consulta a Edge Function `dictionary` (cache-first, Claude Haiku por trás). */
export async function lookupWord(
  term: string,
  direction: Direction,
): Promise<LookupResult> {
  const { data, error } = await supabase.functions.invoke('dictionary', {
    body: { term, direction },
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
    throw new Error('Dicionário indisponível no momento. Tente novamente.');
  }
  return data as LookupResult;
}
