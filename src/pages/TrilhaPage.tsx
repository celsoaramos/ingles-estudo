import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { TopicSummary } from '../domain/types';
import { LEARNING_PATH, PATH_TOPIC_IDS } from '../domain/learningPath';
import { useTopics } from '../hooks/useTopics';
import { statsRepository } from '../repositories/StatsRepository';

type TopicStatus = 'done' | 'progress' | 'todo';

/** Acima disso um tópico praticado conta como "dominado". */
const MASTERY_PCT = 70;

interface Group {
  label: string;
  description: string;
  topics: TopicSummary[];
}

export function TrilhaPage() {
  const { user } = useAuth();
  const { topics, loading } = useTopics();
  const [accuracy, setAccuracy] = useState<Map<string, number> | null>(null);

  useEffect(() => {
    if (!user) {
      setAccuracy(null);
      return;
    }
    let active = true;
    statsRepository
      .getTopicStats()
      .then((stats) => {
        if (active) {
          setAccuracy(
            new Map(stats.filter((s) => s.attempts > 0).map((s) => [s.topicId, s.accuracyPct])),
          );
        }
      })
      .catch(() => active && setAccuracy(new Map()));
    return () => {
      active = false;
    };
  }, [user]);

  const groups = useMemo<Group[]>(() => {
    if (topics.length === 0) return [];
    const byId = new Map(topics.map((t) => [t.id, t]));
    const result: Group[] = LEARNING_PATH.map((level) => ({
      label: level.label,
      description: level.description,
      topics: level.topicIds
        .map((id) => byId.get(id))
        .filter((t): t is TopicSummary => Boolean(t)),
    }));
    const extras = topics.filter((t) => !PATH_TOPIC_IDS.includes(t.id));
    if (extras.length > 0) {
      result.push({
        label: 'Outros tópicos',
        description: 'Assuntos extras para explorar quando quiser.',
        topics: extras,
      });
    }
    return result;
  }, [topics]);

  function statusOf(topicId: string): TopicStatus {
    const pct = accuracy?.get(topicId);
    if (pct === undefined) return 'todo';
    return pct >= MASTERY_PCT ? 'done' : 'progress';
  }

  if (loading) {
    return (
      <div className="container">
        <p className="empty-state">Carregando trilha…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Trilha</div>
        <h1>
          Seu <span className="accent">caminho</span> no inglês
        </h1>
        <p className="subtitle">
          Estude na ordem sugerida, do básico ao avançado — um passo de cada vez.
        </p>
      </header>

      {!user && (
        <p className="trilha-hint">
          Entre na sua conta para ver seu progresso em cada etapa da trilha.
        </p>
      )}

      {groups.map((group) => {
        const done = group.topics.filter((t) => statusOf(t.id) === 'done').length;
        return (
          <section className="trilha-level" key={group.label}>
            <div className="trilha-level-head">
              <h2>{group.label}</h2>
              {user && (
                <span className="trilha-level-count">
                  {done}/{group.topics.length}
                </span>
              )}
            </div>
            <p className="trilha-level-desc">{group.description}</p>
            <ol className="trilha-topics">
              {group.topics.map((t) => {
                const status = statusOf(t.id);
                const pct = accuracy?.get(t.id);
                return (
                  <li key={t.id}>
                    <Link
                      to={`/topico/${t.id}`}
                      className={`trilha-topic status-${status}`}
                    >
                      <span className="trilha-topic-mark">
                        {status === 'done' ? '✓' : status === 'progress' ? '◐' : '○'}
                      </span>
                      <span className="trilha-topic-body">
                        <strong>{t.title}</strong>
                        <small>{t.subtitle}</small>
                      </span>
                      {pct !== undefined && (
                        <span className="trilha-topic-pct">{pct}%</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
