import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginCta } from '../components/LoginCta';
import type { QuizConfig, SessionMode } from '../domain/types';
import { useTopics } from '../hooks/useTopics';

const COUNT_OPTIONS: { value: QuizConfig['questionCount']; label: string }[] = [
  { value: 10, label: '10 questões' },
  { value: 20, label: '20 questões' },
  { value: 'all', label: 'Todas' },
];

export function ExercisesSetupPage() {
  const { topics, loading } = useTopics();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<SessionMode>('imediata');
  const [includeMastered, setIncludeMastered] = useState(true);
  const [questionCount, setQuestionCount] =
    useState<QuizConfig['questionCount']>(10);

  const allSelected = topics.length > 0 && selected.size === topics.length;

  function toggleTopic(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function start() {
    const config: QuizConfig = {
      topicIds: [...selected],
      mode,
      includeMastered,
      questionCount,
    };
    navigate('/exercicios/sessao', { state: { config } });
  }

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Prática</div>
        <h1>
          Monte seu <span className="accent">treino</span>
        </h1>
        <p className="subtitle">
          Escolha os tópicos, o modo de correção e comece a praticar
        </p>
      </header>

      <LoginCta />

      <section className="setup-section">
        <div className="setup-title-row">
          <h2 className="setup-title">1 · Quais tópicos?</h2>
          <button
            type="button"
            className="chip"
            onClick={() =>
              setSelected(
                allSelected ? new Set() : new Set(topics.map((t) => t.id)),
              )
            }
          >
            {allSelected ? 'Limpar seleção' : 'Selecionar todos'}
          </button>
        </div>
        {loading ? (
          <p className="empty-state">Carregando tópicos…</p>
        ) : (
          <div className="setup-topics">
            {topics.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`setup-topic ${selected.has(t.id) ? 'selected' : ''}`}
                onClick={() => toggleTopic(t.id)}
              >
                <span className="setup-topic-check">
                  {selected.has(t.id) ? '✓' : ''}
                </span>
                <span>
                  {t.title}
                  <small>{t.exerciseCount} questões</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="setup-section">
        <h2 className="setup-title">2 · Como corrigir?</h2>
        <div className="setup-options">
          <button
            type="button"
            className={`setup-option ${mode === 'imediata' ? 'selected' : ''}`}
            onClick={() => setMode('imediata')}
          >
            <strong>⚡ Correção imediata</strong>
            <span>Veja se acertou (e por quê) a cada resposta</span>
          </button>
          <button
            type="button"
            className={`setup-option ${mode === 'simulado' ? 'selected' : ''}`}
            onClick={() => setMode('simulado')}
          >
            <strong>🎯 Simulado</strong>
            <span>Responda tudo e confira o resultado no final</span>
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h2 className="setup-title">3 · Quantas questões?</h2>
        <div className="category-chips">
          {COUNT_OPTIONS.map((c) => (
            <button
              type="button"
              key={String(c.value)}
              className={`chip ${questionCount === c.value ? 'active' : ''}`}
              onClick={() => setQuestionCount(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="setup-toggle">
          <input
            type="checkbox"
            checked={!includeMastered}
            onChange={(e) => setIncludeMastered(!e.target.checked)}
          />
          <span>
            Pular questões que já acertei{' '}
            <small>— foca no que você ainda erra</small>
          </span>
        </label>
      </section>

      <button
        type="button"
        className="button-primary setup-start"
        disabled={selected.size === 0}
        onClick={start}
      >
        {selected.size === 0
          ? 'Selecione ao menos um tópico'
          : `Começar (${selected.size} tópico${selected.size > 1 ? 's' : ''})`}
      </button>
    </div>
  );
}
