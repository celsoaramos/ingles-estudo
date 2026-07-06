import type { AttemptRecord, SessionSummary } from '../domain/types';

/**
 * Contrato de gravação/consulta do progresso do usuário nos exercícios.
 * Anônimo -> LocalProgressRepository (localStorage);
 * logado  -> SupabaseProgressRepository (tabelas exercise_sessions/answer_attempts).
 */
export interface ProgressRepository {
  /** Grava as tentativas de uma sessão (ou avulsas, sem session). */
  recordAttempts(attempts: AttemptRecord[], session?: SessionSummary): Promise<void>;
  /** IDs de exercícios que o usuário já acertou ao menos uma vez nos tópicos dados. */
  getCorrectExerciseIds(topicIds: string[]): Promise<Set<string>>;
}
