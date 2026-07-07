import type { Exercise } from '../domain/types';

/** Fisher–Yates: retorna uma cópia embaralhada, sem mutar a original. */
export function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Embaralha as alternativas de uma questão, remapeando `answer` e guardando
 * em `optionOrder` o índice original de cada posição exibida. Compõe com um
 * embaralhamento anterior (retry de retry), então o mapa sempre aponta para
 * a ordem canônica do banco.
 */
export function shuffleExerciseOptions(ex: Exercise): Exercise {
  const perm = shuffle(ex.options.map((_, i) => i));
  const base = ex.optionOrder ?? ex.options.map((_, i) => i);
  return {
    ...ex,
    options: perm.map((p) => ex.options[p]),
    answer: perm.indexOf(ex.answer),
    optionOrder: perm.map((p) => base[p]),
  };
}

/** Índice canônico (do banco) da opção exibida na posição `displayed`. */
export function canonicalOptionIndex(ex: Exercise, displayed: number): number {
  return ex.optionOrder?.[displayed] ?? displayed;
}

/** Opções e resposta na ordem canônica do banco (para cache/IA). */
export function canonicalExercise(ex: Exercise): {
  options: string[];
  answer: number;
} {
  if (!ex.optionOrder) return { options: ex.options, answer: ex.answer };
  const options: string[] = [];
  ex.options.forEach((opt, i) => {
    options[ex.optionOrder![i]] = opt;
  });
  return { options, answer: ex.optionOrder[ex.answer] };
}
