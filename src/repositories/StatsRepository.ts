import { supabase } from '../lib/supabase';

export interface TopicStats {
  topicId: string;
  attempts: number;
  correct: number;
  accuracyPct: number;
}

export interface DailyStats {
  day: string; // YYYY-MM-DD (fuso America/Sao_Paulo)
  attempts: number;
  correct: number;
}

export interface HardExercise {
  exerciseId: string;
  topicId: string;
  question: string;
  attempts: number;
  wrong: number;
}

export interface SessionRow {
  id: string;
  mode: string;
  topicIds: string[];
  totalQuestions: number;
  correctCount: number | null;
  startedAt: string;
}

/** Consultas de estatística do usuário logado (views com security_invoker + RLS). */
export class StatsRepository {
  async getTopicStats(): Promise<TopicStats[]> {
    const { data, error } = await supabase
      .from('user_topic_stats')
      .select('topic_id, attempts, correct, accuracy_pct');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      topicId: r.topic_id,
      attempts: r.attempts,
      correct: r.correct,
      accuracyPct: Number(r.accuracy_pct),
    }));
  }

  async getDailyStats(days = 30): Promise<DailyStats[]> {
    const since = new Date(Date.now() - days * 86400_000)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('day, attempts, correct')
      .gte('day', since)
      .order('day', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      day: r.day,
      attempts: r.attempts,
      correct: r.correct,
    }));
  }

  /** Todos os dias com atividade (para calcular o streak). */
  async getActiveDays(): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('day')
      .order('day', { ascending: false })
      .limit(400);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.day as string);
  }

  async getHardestExercises(limit = 10): Promise<HardExercise[]> {
    const { data, error } = await supabase
      .from('user_hardest_exercises')
      .select('exercise_id, topic_id, attempts, wrong')
      .order('wrong', { ascending: false })
      .order('error_pct', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.exercise_id);
    const { data: exs, error: exErr } = await supabase
      .from('exercises')
      .select('id, question')
      .in('id', ids);
    if (exErr) throw new Error(exErr.message);
    const questionById = new Map((exs ?? []).map((e) => [e.id, e.question]));

    return rows.map((r) => ({
      exerciseId: r.exercise_id,
      topicId: r.topic_id,
      question: questionById.get(r.exercise_id) ?? '(questão removida)',
      attempts: r.attempts,
      wrong: r.wrong,
    }));
  }

  async getSessions(limit = 15): Promise<SessionRow[]> {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .select('id, mode, topic_ids, total_questions, correct_count, started_at')
      .order('started_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      mode: r.mode,
      topicIds: r.topic_ids ?? [],
      totalQuestions: r.total_questions,
      correctCount: r.correct_count,
      startedAt: r.started_at,
    }));
  }
}

export const statsRepository = new StatsRepository();

/** Dia atual no fuso de São Paulo, formato YYYY-MM-DD. */
export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

/** Streak: dias consecutivos de estudo terminando hoje ou ontem. */
export function computeStreak(activeDaysDesc: string[]): number {
  if (activeDaysDesc.length === 0) return 0;
  const today = todayInSaoPaulo();
  const days = new Set(activeDaysDesc);
  // streak vale se o último estudo foi hoje ou ontem
  const start = days.has(today)
    ? today
    : days.has(addDays(today, -1))
      ? addDays(today, -1)
      : null;
  if (!start) return 0;
  let streak = 0;
  let cursor = start;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function addDays(isoDay: string, delta: number): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
