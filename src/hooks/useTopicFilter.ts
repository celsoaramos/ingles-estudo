import { useMemo, useState } from 'react';
import type { CategoryId, TopicSummary } from '../domain/types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function useTopicFilter(topics: TopicSummary[]) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return topics.filter((t) => {
      if (category && t.category !== category) return false;
      if (!query) return true;
      const haystack = normalize(
        [t.title, t.subtitle, ...t.tags].join(' '),
      );
      return haystack.includes(query);
    });
  }, [topics, search, category]);

  return { search, setSearch, category, setCategory, filtered };
}
