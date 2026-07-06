import { SupabaseTopicRepository } from './SupabaseTopicRepository';
import type { TopicRepository } from './TopicRepository';

/** Ponto único de troca da fonte de dados. */
export const topicRepository: TopicRepository = new SupabaseTopicRepository();

export type { TopicRepository };
