import { useMemo } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginCta } from '../components/LoginCta';
import { RichText } from '../components/RichText';
import { useTopics } from '../hooks/useTopics';
import type { SessionResultState } from './ExerciseSessionPage';

export function ExercisesResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topics } = useTopics();
  const state = location.state as SessionResultState | null;

  const topicTitle = useMemo(() => {
    const map = new Map(topics.map((t) => [t.id, t.title]));
    return (id: string) => map.get(id) ?? id;
  }, [topics]);

  const byTopic = useMemo(() => {
    if (!state) return [];
    const acc = new Map<string, { total: number; correct: number }>();
    state.exercises.forEach((ex, i) => {
      const t = acc.get(ex.topicId) ?? { total: 0, correct: 0 };
      t.total += 1;
      if (state.chosen[i] === ex.answer) t.correct += 1;
      acc.set(ex.topicId, t);
    });
    return [...acc.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [state]);

  if (!state) return <Navigate to="/exercicios" replace />;

  const { exercises, chosen, mode } = state;
  const correct = exercises.filter((ex, i) => chosen[i] === ex.answer).length;
  const pct = Math.round((correct / exercises.length) * 100);
  const wrong = exercises.filter((ex, i) => chosen[i] !== ex.answer);

  const grade =
    pct >= 90 ? '🏆 Excelente!' : pct >= 70 ? '💪 Muito bem!' : pct >= 50 ? '📈 No caminho!' : '🌱 Continue praticando!';

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">
          {mode === 'simulado' ? 'Resultado do simulado' : 'Resultado do treino'}
        </div>
        <h1>
          {correct}/{exercises.length}{' '}
          <span className="accent">({pct}%)</span>
        </h1>
        <p className="subtitle">{grade}</p>
      </header>

      <LoginCta />

      {byTopic.length > 1 && (
        <section className="result-topics">
          <h2 className="setup-title">Por tópico</h2>
          {byTopic.map(([topicId, s]) => (
            <div className="result-topic-row" key={topicId}>
              <span className="result-topic-name">{topicTitle(topicId)}</span>
              <div className="result-bar">
                <div
                  className="result-bar-fill"
                  style={{ width: `${(s.correct / s.total) * 100}%` }}
                />
              </div>
              <span className="result-topic-score">
                {s.correct}/{s.total}
              </span>
            </div>
          ))}
        </section>
      )}

      {wrong.length > 0 && (
        <section className="result-review">
          <h2 className="setup-title">
            Revisão das erradas ({wrong.length})
          </h2>
          {exercises.map((ex, i) =>
            chosen[i] === ex.answer ? null : (
              <div className="quiz-question" key={ex.id}>
                <p className="quiz-prompt">
                  <RichText text={ex.question} />
                </p>
                <div className="result-answer wrong-answer">
                  ✗ Sua resposta: {ex.options[chosen[i]] ?? '—'}
                </div>
                <div className="result-answer right-answer">
                  ✓ Correta: {ex.options[ex.answer]}
                </div>
                <div className="quiz-feedback nok">
                  <RichText text={ex.explanation} />
                </div>
              </div>
            ),
          )}
        </section>
      )}

      <div className="result-actions">
        {wrong.length > 0 && (
          <button
            type="button"
            className="button-primary"
            onClick={() =>
              navigate('/exercicios/sessao', {
                state: { retry: { exercises: wrong, mode } },
              })
            }
          >
            ↻ Refazer as erradas ({wrong.length})
          </button>
        )}
        <Link className="button-ghost" to="/exercicios">
          Montar novo treino
        </Link>
        <Link className="button-ghost" to="/estatisticas">
          📊 Ver minhas estatísticas
        </Link>
      </div>
    </div>
  );
}
