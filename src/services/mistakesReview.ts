import type { Exercise } from '../domain/types';
import { shuffle } from '../lib/shuffle';
import { exerciseRepository } from '../repositories/ExerciseRepository';
import type { ProgressRepository } from '../repositories/ProgressRepository';

/** Máximo de questões numa rodada de revisão de erros. */
export const MAX_REVIEW = 20;

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
