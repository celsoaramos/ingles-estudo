import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { QuizConfig } from '../domain/types';
import { MAX_GOAL, MIN_GOAL, useDailyGoal } from '../hooks/useDailyGoal';
import { useMistakesReview } from '../hooks/useMistakesReview';
import { useTodayPlan } from '../hooks/useTodayPlan';

/**
 * "Plano de hoje": monta a rotina do dia (revisão, ponto fraco, tópico novo)
 * a partir do progresso existente. Fica no topo da Home como porta de entrada.
 */
export function TodayPanel() {
  const plan = useTodayPlan();
  const navigate = useNavigate();
  const { start: startReview, starting } = useMistakesReview();
  const { goal, setGoal } = useDailyGoal();
  const [editingGoal, setEditingGoal] = useState(false);

  if (plan.loading) {
    return (
      <section className="today-panel">
        <p className="today-loading">Montando seu dia…</p>
      </section>
    );
  }

  function practiceWeak(topicId: string) {
    const config: QuizConfig = {
      topicIds: [topicId],
      mode: 'imediata',
      includeMastered: true,
      questionCount: 10,
    };
    navigate('/exercicios/sessao', { state: { config } });
  }

  const goalReached = plan.isLoggedIn && plan.todayCount >= goal;
  const goalPct = Math.min(100, Math.round((plan.todayCount / goal) * 100));
  const hasAction =
    plan.dueFlashcards > 0 ||
    plan.wrongCount > 0 ||
    plan.weakTopic ||
    plan.newTopic;

  return (
    <section className="today-panel">
      <div className="today-head">
        <h2>Seu plano de hoje</h2>
        {plan.isLoggedIn && plan.streak > 0 && (
          <span className="today-streak">
            {plan.streak} 🔥 dia{plan.streak === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {plan.isLoggedIn && (
        <div className={`today-goal ${goalReached ? 'done' : ''}`}>
          <div className="today-goal-bar">
            <div className="today-goal-fill" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="today-goal-row">
            <span className="today-goal-label">
              {goalReached
                ? '✓ Meta do dia batida! 🎉'
                : `Meta do dia · ${plan.todayCount}/${goal} questões`}
            </span>
            {editingGoal ? (
              <span className="today-goal-edit">
                <input
                  type="number"
                  min={MIN_GOAL}
                  max={MAX_GOAL}
                  defaultValue={goal}
                  autoFocus
                  onBlur={(e) => {
                    setGoal(Number(e.target.value));
                    setEditingGoal(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') setEditingGoal(false);
                  }}
                />
                <small>por dia</small>
              </span>
            ) : (
              <button
                type="button"
                className="today-goal-btn"
                onClick={() => setEditingGoal(true)}
              >
                ajustar meta
              </button>
            )}
          </div>
        </div>
      )}

      <div className="today-actions">
        {plan.dueFlashcards > 0 && (
          <Link to="/flashcards" className="today-action accent-purple">
            <span className="today-action-icon">🃏</span>
            <span className="today-action-text">
              <strong>
                {plan.dueFlashcards} flashcard
                {plan.dueFlashcards > 1 ? 's' : ''} para revisar
              </strong>
              <small>Revisão espaçada — reforce antes de esquecer</small>
            </span>
            <span className="today-action-arrow">→</span>
          </Link>
        )}

        {plan.wrongCount > 0 && (
          <button
            type="button"
            className="today-action accent-yellow"
            disabled={starting}
            onClick={() => void startReview()}
          >
            <span className="today-action-icon">🔁</span>
            <span className="today-action-text">
              <strong>
                {starting
                  ? 'Preparando…'
                  : `Refazer meus erros (${plan.wrongCount})`}
              </strong>
              <small>Volte nas questões que você já errou e fixe de vez</small>
            </span>
            <span className="today-action-arrow">→</span>
          </button>
        )}

        {plan.weakTopic && (
          <button
            type="button"
            className="today-action accent-orange"
            onClick={() => practiceWeak(plan.weakTopic!.id)}
          >
            <span className="today-action-icon">🎯</span>
            <span className="today-action-text">
              <strong>Reforçar {plan.weakTopic.title}</strong>
              <small>
                Seu ponto mais fraco — {plan.weakTopic.accuracyPct}% de acerto
              </small>
            </span>
            <span className="today-action-arrow">→</span>
          </button>
        )}

        {plan.newTopic && (
          <Link
            to={`/topico/${plan.newTopic.id}`}
            className="today-action accent-blue"
          >
            <span className="today-action-icon">📚</span>
            <span className="today-action-text">
              <strong>Aprender algo novo: {plan.newTopic.title}</strong>
              <small>Um tópico que você ainda não praticou</small>
            </span>
            <span className="today-action-arrow">→</span>
          </Link>
        )}

        {!hasAction && (
          <Link to="/exercicios" className="today-action accent-green">
            <span className="today-action-icon">✏️</span>
            <span className="today-action-text">
              <strong>Praticar exercícios</strong>
              <small>Monte um treino do jeito que quiser</small>
            </span>
            <span className="today-action-arrow">→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
