import type { Block, CategoryId, Exercise, Topic, TopicSummary } from '../domain/types';
import { supabase } from '../lib/supabase';
import type { TopicRepository } from './TopicRepository';

interface ExerciseRow {
  id: string;
  topic_id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: number;
}

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    topicId: row.topic_id,
    question: row.question,
    options: row.options,
    answer: row.answer,
    explanation: row.explanation,
    difficulty: row.difficulty as Exercise['difficulty'],
  };
}

/** Implementação sobre o Supabase (tabelas topics + exercises, leitura anônima via RLS). */
export class SupabaseTopicRepository implements TopicRepository {
  async getAll(): Promise<TopicSummary[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, subtitle, category, tags, exercises(count)');
    if (error) throw new Error(`Erro ao carregar assuntos: ${error.message}`);

    return (data ?? [])
      .map((t) => ({
        id: t.id as string,
        title: t.title as string,
        subtitle: t.subtitle as string,
        category: t.category as CategoryId,
        tags: (t.tags ?? []) as string[],
        exerciseCount: (t.exercises as unknown as { count: number }[])[0]?.count ?? 0,
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }

  async getById(id: string): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('topics')
      .select(
        'id, title, title_highlight, subtitle, category, tags, blocks, exercises(id, topic_id, question, options, answer, explanation, difficulty)',
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Erro ao carregar assunto: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      titleHighlight: data.title_highlight ?? undefined,
      subtitle: data.subtitle,
      category: data.category as CategoryId,
      tags: data.tags ?? [],
      blocks: data.blocks as Block[],
      exercises: ((data.exercises ?? []) as ExerciseRow[]).map(toExercise),
    };
  }
}
