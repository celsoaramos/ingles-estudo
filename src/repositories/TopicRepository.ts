import type { Topic, TopicSummary } from '../domain/types';

/**
 * Contrato de acesso aos assuntos. Hoje a implementação lê JSON local
 * (JsonTopicRepository); se o projeto crescer, basta criar uma
 * ApiTopicRepository com este mesmo contrato e trocar no provider.
 */
export interface TopicRepository {
  getAll(): Promise<TopicSummary[]>;
  getById(id: string): Promise<Topic | null>;
}
