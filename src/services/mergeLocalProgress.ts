import {
  clearLocalProgress,
  exportLocalAttempts,
} from '../repositories/LocalProgressRepository';
import { SupabaseProgressRepository } from '../repositories/SupabaseProgressRepository';

const MERGED_FLAG = 'ingles.progress.merged';

/**
 * Migra o progresso anônimo (localStorage) para a conta no primeiro login.
 * One-way e idempotente via flag: roda uma vez e limpa o armazenamento local.
 */
export async function mergeLocalProgressIntoAccount(userId: string) {
  if (localStorage.getItem(MERGED_FLAG)) return;
  const attempts = exportLocalAttempts();
  if (attempts.length > 0) {
    try {
      await new SupabaseProgressRepository(userId).recordAttempts(attempts);
    } catch {
      // rede falhou: não marca a flag, tenta de novo no próximo login
      return;
    }
  }
  localStorage.setItem(MERGED_FLAG, '1');
  clearLocalProgress();
}
