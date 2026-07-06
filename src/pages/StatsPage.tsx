import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RichText } from '../components/RichText';
import { useAuth } from '../contexts/AuthContext';
import { useTopics } from '../hooks/useTopics';
import {
  computeStreak,
  statsRepository,
  type DailyStats,
  type HardExercise,
  type SessionRow,
  type TopicStats,
} from '../repositories/StatsRepository';

interface StatsData {
  topics: TopicStats[];
  daily: DailyStats[];
  streak: number;
  hardest: HardExercise[];
  sessions: SessionRow[];
}

export function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { topics: allTopics } = useTopics();
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topicTitle = useMemo(() => {
    const map = new Map(allTopics.map((t) => [t.id, t.title]));
    return (id: string) => map.get(id) ?? id;
  }, [allTopics]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      statsRepository.getTopicStats(),
      statsRepository.getDailyStats(30),
      statsRepository.getActiveDays(),
      statsRepository.getHardestExercises(10),
      statsRepository.getSessions(15),
    ])
      .then(([topics, daily, activeDays, hardest, sessions]) => {
        if (!active) return;
        setData({
          topics,
          daily,
          streak: computeStreak(activeDays),
          hardest,
          sessions,
        });
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="container">
        <p className="empty-state">Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container auth-page">
        <header className="home-header">
          <div className="label">Estatísticas</div>
          <h1>
            Acompanhe sua <span className="accent">evolução</span>
          </h1>
          <p className="subtitle">
            Acertos e erros no geral e por tópico, evolução diária, sequência
            de estudos e as questões que você mais erra.
          </p>
        </header>
        <div className="auth-card">
          <p className="auth-hint">
            As estatísticas precisam de uma conta (gratuita) para guardar seu
            histórico. Criar leva 10 segundos — só e-mail e senha.
          </p>
          <Link
            className="button-primary"
            to="/entrar"
            state={{ from: location.pathname }}
          >
            Entrar ou criar conta
          </Link>
          <Link className="button-ghost" to="/exercicios">
            Praticar sem conta
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="empty-state">Erro ao carregar estatísticas: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <p className="empty-state">Calculando suas estatísticas…</p>
      </div>
    );
  }

  const totalAttempts = data.topics.reduce((s, t) => s + t.attempts, 0);
  const totalCorrect = data.topics.reduce((s, t) => s + t.correct, 0);
  const overallPct =
    totalAttempts > 0 ? Math.round((100 * totalCorrect) / totalAttempts) : 0;
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.attempts));
  const sortedTopics = [...data.topics].sort(
    (a, b) => a.accuracyPct - b.accuracyPct,
  );

  if (totalAttempts === 0) {
    return (
      <div className="container">
        <header className="home-header">
          <div className="label">Estatísticas</div>
          <h1>
            Ainda sem <span className="accent">dados</span>
          </h1>
          <p className="subtitle">
            Responda alguns exercícios e volte aqui para ver sua evolução.
          </p>
        </header>
        <Link className="button-primary" to="/exercicios">
          ✏️ Começar a praticar
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Estatísticas · {user.email}</div>
        <h1>
          Sua <span className="accent">evolução</span>
        </h1>
      </header>

      <div className="stats-cards">
        <div className="stats-card accent-blue">
          <strong>{totalAttempts}</strong>
          <span>questões respondidas</span>
        </div>
        <div className="stats-card accent-green">
          <strong>{overallPct}%</strong>
          <span>de acerto geral</span>
        </div>
        <div className="stats-card accent-orange">
          <strong>{data.streak} 🔥</strong>
          <span>dia{data.streak === 1 ? '' : 's'} seguidos</span>
        </div>
        <div className="stats-card accent-purple">
          <strong>{data.sessions.length}</strong>
          <span>treinos recentes</span>
        </div>
      </div>

      <section className="stats-section">
        <h2 className="setup-title">Acerto por tópico (do mais difícil ao mais fácil)</h2>
        {sortedTopics.map((t) => (
          <div className="result-topic-row" key={t.topicId}>
            <span className="result-topic-name">{topicTitle(t.topicId)}</span>
            <div className="result-bar">
              <div
                className="result-bar-fill"
                style={{ width: `${t.accuracyPct}%` }}
              />
            </div>
            <span className="result-topic-score">
              {t.accuracyPct}% ({t.correct}/{t.attempts})
            </span>
          </div>
        ))}
        {sortedTopics.length > 0 && sortedTopics[0].accuracyPct < 70 && (
          <p className="stats-tip">
            💡 Dica: revise o resumo de{' '}
            <Link to={`/topico/${sortedTopics[0].topicId}`}>
              {topicTitle(sortedTopics[0].topicId)}
            </Link>{' '}
            — é seu tópico com mais erros.
          </p>
        )}
      </section>

      {data.daily.length > 0 && (
        <section className="stats-section">
          <h2 className="setup-title">Últimos 30 dias</h2>
          <div className="stats-chart">
            {data.daily.map((d) => (
              <div
                className="stats-chart-col"
                key={d.day}
                title={`${d.day}: ${d.correct}/${d.attempts} certas`}
              >
                <div
                  className="stats-chart-bar"
                  style={{ height: `${(d.attempts / maxDaily) * 100}%` }}
                >
                  <div
                    className="stats-chart-bar-correct"
                    style={{ height: `${(d.correct / Math.max(1, d.attempts)) * 100}%` }}
                  />
                </div>
                <span className="stats-chart-label">{d.day.slice(8)}</span>
              </div>
            ))}
          </div>
          <p className="stats-legend">
            <span className="legend-total" /> respondidas ·{' '}
            <span className="legend-correct" /> certas
          </p>
        </section>
      )}

      {data.hardest.length > 0 && (
        <section className="stats-section">
          <h2 className="setup-title">Questões que você mais erra</h2>
          {data.hardest.map((h) => (
            <div className="stats-hard-row" key={h.exerciseId}>
              <span className="stats-hard-question">
                <RichText text={h.question} />
                <small>{topicTitle(h.topicId)}</small>
              </span>
              <span className="stats-hard-count">
                {h.wrong}✗ / {h.attempts}
              </span>
            </div>
          ))}
        </section>
      )}

      {data.sessions.length > 0 && (
        <section className="stats-section">
          <h2 className="setup-title">Histórico de treinos</h2>
          {data.sessions.map((s) => (
            <div className="stats-session-row" key={s.id}>
              <span>
                {s.mode === 'simulado' ? '🎯' : '⚡'}{' '}
                {new Date(s.startedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })}
                <small>
                  {s.topicIds.slice(0, 3).map(topicTitle).join(', ')}
                  {s.topicIds.length > 3 ? '…' : ''}
                </small>
              </span>
              <span className="stats-session-score">
                {s.correctCount ?? '–'}/{s.totalQuestions}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
