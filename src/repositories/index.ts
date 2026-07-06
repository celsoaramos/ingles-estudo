import { JsonTopicRepository } from './JsonTopicRepository';
import type { TopicRepository } from './TopicRepository';

/** Ponto único de troca da fonte de dados (JSON local → API futura). */
export const topicRepository: TopicRepository = new JsonTopicRepository();

export type { TopicRepository };
