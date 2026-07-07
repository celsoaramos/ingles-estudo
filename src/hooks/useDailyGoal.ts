import { useState } from 'react';

const KEY = 'ingles.dailyGoal.v1';
export const DEFAULT_GOAL = 10;
export const MIN_GOAL = 1;
export const MAX_GOAL = 100;

function clamp(n: number): number {
  return Math.min(MAX_GOAL, Math.max(MIN_GOAL, Math.round(n)));
}

export function loadDailyGoal(): number {
  const raw = Number(localStorage.getItem(KEY));
  return Number.isFinite(raw) && raw >= MIN_GOAL ? clamp(raw) : DEFAULT_GOAL;
}

/** Meta diária de questões, escolhida pelo usuário (persistida no navegador). */
export function useDailyGoal() {
  const [goal, setGoalState] = useState(loadDailyGoal);

  function setGoal(next: number) {
    if (!Number.isFinite(next)) return;
    const value = clamp(next);
    localStorage.setItem(KEY, String(value));
    setGoalState(value);
  }

  return { goal, setGoal };
}
