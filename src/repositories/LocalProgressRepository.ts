import type { AttemptRecord, SessionSummary } from '../domain/types';
import type { ProgressRepository } from './ProgressRepository';

const STORAGE_KEY = 'ingles.progress.v1';
const MAX_SESSIONS = 20;

interface StoredExercise {
  topicId: string;
  correct: number;
  wrong: number;
  lastAnsweredAt: string;
  /** Resultado da tentativa mais recente (ausente em dados antigos). */
  lastWasCorrect?: boolean;
}

interface StoredProgress {
  exercises: Record<string, StoredExercise>;
  sessions: SessionSummary[];
}

function load(): StoredProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredProgress;
  } catch {
    // dado corrompido: recomeça do zero
  }
  return { exercises: {}, sessions: [] };
}

function save(data: StoredProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Progresso de usuários anônimos, guardado no navegador. */
export class LocalProgressRepository implements ProgressRepository {
  async recordAttempts(attempts: AttemptRecord[], session?: SessionSummary) {
    const data = load();
    for (const a of attempts) {
      const ex = data.exercises[a.exerciseId] ?? {
        topicId: a.topicId,
        correct: 0,
        wrong: 0,
        lastAnsweredAt: a.answeredAt,
      };
      if (a.isCorrect) ex.correct += 1;
      else ex.wrong += 1;
      ex.lastAnsweredAt = a.answeredAt;
      ex.lastWasCorrect = a.isCorrect;
      data.exercises[a.exerciseId] = ex;
    }
    if (session) {
      data.sessions.unshift(session);
      data.sessions = data.sessions.slice(0, MAX_SESSIONS);
    }
    save(data);
  }

  async getCorrectExerciseIds(topicIds: string[]) {
    const data = load();
    const topics = new Set(topicIds);
    return new Set(
      Object.entries(data.exercises)
        .filter(([, ex]) => ex.correct > 0 && topics.has(ex.topicId))
        .map(([id]) => id),
    );
  }

  async getWrongExerciseIds() {
    // errou alguma vez e não acertou na tentativa mais recente
    const data = load();
    return new Set(
      Object.entries(data.exercises)
        .filter(([, ex]) => ex.wrong > 0 && ex.lastWasCorrect !== true)
        .map(([id]) => id),
    );
  }
}

/** Exporta as tentativas locais para o merge local→conta no primeiro login. */
export function exportLocalAttempts(): AttemptRecord[] {
  const data = load();
  return Object.entries(data.exercises).flatMap(([exerciseId, ex]) => {
    // preserva qual foi o resultado mais recente: a última tentativa fica com
    // lastAnsweredAt e as demais um minuto antes, para a conta reproduzir a
    // mesma lista de "refazer meus erros" depois do merge.
    const lastWasCorrect = ex.lastWasCorrect ?? ex.wrong === 0;
    const earlier = new Date(
      new Date(ex.lastAnsweredAt).getTime() - 60_000,
    ).toISOString();
    const mk = (isCorrect: boolean): AttemptRecord => ({
      exerciseId,
      topicId: ex.topicId,
      chosen: -1, // opção original não é guardada no resumo local
      isCorrect,
      answeredAt: isCorrect === lastWasCorrect ? ex.lastAnsweredAt : earlier,
    });
    return [
      ...Array.from({ length: ex.correct }, () => mk(true)),
      ...Array.from({ length: ex.wrong }, () => mk(false)),
    ];
  });
}

export function clearLocalProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
