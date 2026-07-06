import type { Category, CategoryId } from './types';

export const CATEGORIES: Category[] = [
  { id: 'tenses', label: 'Tempos Verbais' },
  { id: 'conditionals', label: 'Condicionais' },
  { id: 'versus', label: 'Um vs Outro' },
  { id: 'basics', label: 'Fundamentos' },
  { id: 'structures', label: 'Estruturas' },
];

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
