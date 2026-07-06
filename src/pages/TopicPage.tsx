import { Link, useParams } from 'react-router-dom';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { ExerciseQuiz } from '../components/ExerciseQuiz';
import { categoryLabel } from '../domain/categories';
import { useTopic } from '../hooks/useTopics';

export function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const { topic, loading } = useTopic(id);

  if (loading) {
    return (
      <div className="container">
        <p className="empty-state">Carregando…</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container">
        <p className="empty-state">Assunto não encontrado.</p>
        <p className="empty-state">
          <Link to="/" className="back-link">
            ← Voltar para a lista
          </Link>
        </p>
      </div>
    );
  }

  const [before, after] = topic.titleHighlight
    ? splitTitle(topic.title, topic.titleHighlight)
    : [topic.title, ''];

  return (
    <div className="container">
      <nav className="topic-nav">
        <Link to="/" className="back-link">
          ← Todos os assuntos
        </Link>
        <span className="tag">{categoryLabel(topic.category)}</span>
      </nav>

      <header className="topic-header">
        <h1>
          {before}
          {topic.titleHighlight && (
            <span className="accent">{topic.titleHighlight}</span>
          )}
          {after}
        </h1>
        <p className="subtitle">{topic.subtitle}</p>
      </header>

      {topic.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}

      <ExerciseQuiz exercises={topic.exercises} />

      <footer>
        <Link to="/" className="back-link">
          ← Todos os assuntos
        </Link>
      </footer>
    </div>
  );
}

function splitTitle(title: string, highlight: string): [string, string] {
  const idx = title.indexOf(highlight);
  if (idx === -1) return [title, ''];
  return [title.slice(0, idx), title.slice(idx + highlight.length)];
}
