import type { Exercise } from '../domain/types';
import { supabase } from '../lib/supabase';

interface Row {
  id: string;
  topic_id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: number;
}

/** Busca exercícios de um conjunto de tópicos para montar uma sessão de treino. */
export class ExerciseRepository {
  async getByTopics(topicIds: string[]): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, topic_id, question, options, answer, explanation, difficulty')
      .in('topic_id', topicIds);
    if (error) throw new Error(`Erro ao carregar exercícios: ${error.message}`);
    return ((data ?? []) as Row[]).map((r) => ({
      id: r.id,
      topicId: r.topic_id,
      question: r.question,
      options: r.options,
      answer: r.answer,
      explanation: r.explanation,
      difficulty: r.difficulty as Exercise['difficulty'],
    }));
  }
}

export const exerciseRepository = new ExerciseRepository();
