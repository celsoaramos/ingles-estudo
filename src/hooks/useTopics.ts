import { useEffect, useState } from 'react';
import type { Topic, TopicSummary } from '../domain/types';
import { topicRepository } from '../repositories';

export function useTopics() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    topicRepository.getAll().then((list) => {
      if (active) {
        setTopics(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { topics, loading };
}

export function useTopic(id: string | undefined) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!id) {
      setTopic(null);
      setLoading(false);
      return;
    }
    topicRepository.getById(id).then((t) => {
      if (active) {
        setTopic(t);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  return { topic, loading };
}
