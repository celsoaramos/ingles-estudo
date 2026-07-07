import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardRepository } from '../repositories/FlashcardRepository';
import {
  computeStreak,
  statsRepository,
  todayInSaoPaulo,
} from '../repositories/StatsRepository';
import { useProgressRepository } from './useProgressRepository';
import { useTopics } from './useTopics';

export interface TodayPlan {
  loading: boolean;
  isLoggedIn: boolean;
  /** Dias seguidos de estudo (0 se anônimo ou sem histórico). */
  streak: number;
  /** Questões respondidas hoje (0 se anônimo). */
  todayCount: number;
  /** Flashcards vencidos ainda não revisados hoje. */
  dueFlashcards: number;
  /** Questões cuja última tentativa foi errada (a refazer). */
  wrongCount: number;
  /** Tópico com menor acerto (só logado, com histórico suficiente). */
  weakTopic: { id: string; title: string; accuracyPct: number } | null;
  /** Um tópico ainda não praticado, para aprender algo novo. */
  newTopic: { id: string; title: string } | null;
}

interface PlanData {
  streak: number;
  todayCount: number;
  dueFlashcards: number;
  wrongCount: number;
  weakTopic: TodayPlan['weakTopic'];
  newTopic: TodayPlan['newTopic'];
}

const EMPTY: PlanData = {
  streak: 0,
  todayCount: 0,
  dueFlashcards: 0,
  wrongCount: 0,
  weakTopic: null,
  newTopic: null,
};

/**
 * Monta o "plano do dia" a partir do que já existe: sequência, meta, flashcards
 * vencidos, tópico mais fraco e um tópico novo. Logado usa Supabase; anônimo
 * recebe uma versão reduzida (sem sequência/meta/pontos fracos).
 */
export function useTodayPlan(): TodayPlan {
  const { user, loading: authLoading } = useAuth();
  const { topics, loading: topicsLoading } = useTopics();
  const progress = useProgressRepository();
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || topicsLoading) return;
    let active = true;
    setLoading(true);
    (async () => {
      const fc = new FlashcardRepository(user?.id ?? null);
      const firstTopic = topics[0]
        ? { id: topics[0].id, title: topics[0].title }
        : null;

      if (!user) {
        const [due, wrongIds] = await Promise.all([
          fc.countDue().catch(() => 0),
          progress.getWrongExerciseIds().catch(() => new Set<string>()),
        ]);
        if (!active) return;
        setData({
          ...EMPTY,
          dueFlashcards: due,
          wrongCount: wrongIds.size,
          newTopic: firstTopic,
        });
        setLoading(false);
        return;
      }

      const [topicStats, activeDays, daily, due, wrongIds] = await Promise.all([
        statsRepository.getTopicStats().catch(() => []),
        statsRepository.getActiveDays().catch(() => []),
        statsRepository.getDailyStats(2).catch(() => []),
        fc.countDue().catch(() => 0),
        progress.getWrongExerciseIds().catch(() => new Set<string>()),
      ]);
      if (!active) return;

      const titleOf = (id: string) =>
        topics.find((t) => t.id === id)?.title ?? id;
      const today = todayInSaoPaulo();
      const practiced = new Set(
        topicStats.filter((t) => t.attempts > 0).map((t) => t.topicId),
      );
      const weak = [...topicStats]
        .filter((t) => t.attempts >= 3 && t.accuracyPct < 100)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)[0];
      const newT = topics.find((t) => !practiced.has(t.id)) ?? null;

      setData({
        streak: computeStreak(activeDays),
        todayCount: daily.find((d) => d.day === today)?.attempts ?? 0,
        dueFlashcards: due,
        wrongCount: wrongIds.size,
        weakTopic: weak
          ? {
              id: weak.topicId,
              title: titleOf(weak.topicId),
              accuracyPct: weak.accuracyPct,
            }
          : null,
        newTopic: newT ? { id: newT.id, title: newT.title } : null,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, authLoading, topics, topicsLoading]);

  return {
    loading: authLoading || topicsLoading || loading,
    isLoggedIn: !!user,
    ...(data ?? EMPTY),
  };
}
