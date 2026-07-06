import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LocalProgressRepository } from '../repositories/LocalProgressRepository';
import type { ProgressRepository } from '../repositories/ProgressRepository';
import { SupabaseProgressRepository } from '../repositories/SupabaseProgressRepository';

/** Progresso vai para a conta quando logado; para o localStorage quando anônimo. */
export function useProgressRepository(): ProgressRepository {
  const { user } = useAuth();
  return useMemo(
    () =>
      user
        ? new SupabaseProgressRepository(user.id)
        : new LocalProgressRepository(),
    [user],
  );
}
