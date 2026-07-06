import type { Topic, TopicSummary } from '../domain/types';
import type { TopicRepository } from './TopicRepository';

/**
 * Implementação sobre o "banco" em JSON local: um arquivo por assunto
 * em src/data/topics/*.json, carregados de forma estática pelo Vite.
 */
export class JsonTopicRepository implements TopicRepository {
  private topics: Topic[];

  constructor() {
    const modules = import.meta.glob<{ default: Topic }>(
      '../data/topics/*.json',
      { eager: true },
    );
    this.topics = Object.values(modules)
      .map((m) => m.default)
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }

  async getAll(): Promise<TopicSummary[]> {
    return this.topics.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      category: t.category,
      tags: t.tags,
      exerciseCount: t.exercises.length,
    }));
  }

  async getById(id: string): Promise<Topic | null> {
    return this.topics.find((t) => t.id === id) ?? null;
  }
}
