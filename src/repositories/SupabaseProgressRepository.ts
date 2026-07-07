import type { AttemptRecord, SessionSummary } from '../domain/types';
import { supabase } from '../lib/supabase';
import type { ProgressRepository } from './ProgressRepository';

/** Progresso de usuários logados, persistido no Supabase (RLS por usuário). */
export class SupabaseProgressRepository implements ProgressRepository {
  constructor(private userId: string) {}

  async recordAttempts(attempts: AttemptRecord[], session?: SessionSummary) {
    let sessionId: string | null = null;

    if (session) {
      const { data, error } = await supabase
        .from('exercise_sessions')
        .insert({
          user_id: this.userId,
          mode: session.mode,
          topic_ids: session.topicIds,
          total_questions: session.totalQuestions,
          correct_count: session.correctCount,
          started_at: session.startedAt,
          finished_at: session.finishedAt,
        })
        .select('id')
        .single();
      if (error) throw new Error(`Erro ao salvar sessão: ${error.message}`);
      sessionId = data.id;
    }

    if (attempts.length === 0) return;
    const { error } = await supabase.from('answer_attempts').insert(
      attempts.map((a) => ({
        user_id: this.userId,
        exercise_id: a.exerciseId,
        topic_id: a.topicId,
        session_id: sessionId,
        chosen: a.chosen,
        is_correct: a.isCorrect,
        answered_at: a.answeredAt,
      })),
    );
    if (error) throw new Error(`Erro ao salvar respostas: ${error.message}`);
  }

  async getCorrectExerciseIds(topicIds: string[]) {
    const { data, error } = await supabase
      .from('answer_attempts')
      .select('exercise_id')
      .eq('user_id', this.userId)
      .eq('is_correct', true)
      .in('topic_id', topicIds);
    if (error) throw new Error(`Erro ao consultar progresso: ${error.message}`);
    return new Set((data ?? []).map((r) => r.exercise_id as string));
  }

  async getWrongExerciseIds() {
    // olha a tentativa mais recente de cada exercício: quem foi corrigido
    // numa revisão sai da lista; quem errar de novo volta.
    const { data, error } = await supabase
      .from('answer_attempts')
      .select('exercise_id, is_correct, answered_at')
      .eq('user_id', this.userId)
      .order('answered_at', { ascending: false });
    if (error) throw new Error(`Erro ao consultar erros: ${error.message}`);
    const latest = new Map<string, boolean>();
    for (const r of data ?? []) {
      const id = r.exercise_id as string;
      if (!latest.has(id)) latest.set(id, r.is_correct as boolean);
    }
    return new Set(
      [...latest].filter(([, isCorrect]) => !isCorrect).map(([id]) => id),
    );
  }
}
