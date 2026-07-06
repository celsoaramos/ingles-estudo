import { Link } from 'react-router-dom';
import type { TopicSummary } from '../domain/types';
import { categoryLabel } from '../domain/categories';

export function TopicListItem({ topic }: { topic: TopicSummary }) {
  return (
    <Link to={`/topico/${topic.id}`} className="topic-item">
      <div className="topic-item-main">
        <h2>{topic.title}</h2>
        <p>{topic.subtitle}</p>
      </div>
      <div className="topic-item-meta">
        <span className="tag">{categoryLabel(topic.category)}</span>
        {topic.exerciseCount > 0 && (
          <span className="tag tag-exercises">
            ✏️ {topic.exerciseCount} exercícios
          </span>
        )}
      </div>
    </Link>
  );
}
