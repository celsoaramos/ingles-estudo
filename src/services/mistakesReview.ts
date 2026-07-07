import type { Exercise } from '../domain/types';
import { exerciseRepository } from '../repositories/ExerciseRepository';
import type { ProgressRepository } from '../repositories/ProgressRepository';

/** Máximo de questões numa rodada de revisão de erros. */
export const MAX_REVIEW = 20;

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Monta a lista de questões erradas pelo usuário para uma sessão de revisão
 * (embaralhada e limitada). Vazia se não houver erros registrados.
 */
export async function buildMistakesSession(
  progress: ProgressRepository,
): Promise<Exercise[]> {
  const ids = await progress.getWrongExerciseIds();
  if (ids.size === 0) return [];
  const exercises = await exerciseRepository.getByIds([...ids]);
  return shuffle(exercises).slice(0, MAX_REVIEW);
}
