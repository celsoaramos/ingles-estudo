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
    const { data, error } = await supabase
      .from('answer_attempts')
      .select('exercise_id')
      .eq('user_id', this.userId)
      .eq('is_correct', false);
    if (error) throw new Error(`Erro ao consultar erros: ${error.message}`);
    return new Set((data ?? []).map((r) => r.exercise_id as string));
  }
}
