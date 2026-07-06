import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RichText } from '../components/RichText';
import type {
  AttemptRecord,
  Exercise,
  QuizConfig,
  SessionMode,
} from '../domain/types';
import { useProgressRepository } from '../hooks/useProgressRepository';
import { exerciseRepository } from '../repositories/ExerciseRepository';

export interface SessionResultState {
  exercises: Exercise[];
  chosen: number[];
  mode: SessionMode;
}

interface LocationState {
  config?: QuizConfig;
  /** repetição direta de uma lista de questões (ex.: "refazer erradas") */
  retry?: { exercises: Exercise[]; mode: SessionMode };
}

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function ExerciseSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const progress = useProgressRepository();
  const state = (location.state ?? {}) as LocationState;

  const [exercises, setExercises] = useState<Exercise[] | null>(
    state.retry ? state.retry.exercises : null,
  );
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [saving, setSaving] = useState(false);

  const mode: SessionMode =
    state.retry?.mode ?? state.config?.mode ?? 'imediata';

  const config = state.config;

  useEffect(() => {
    if (!config || state.retry) return;
    let active = true;
    (async () => {
      let pool = await exerciseRepository.getByTopics(config.topicIds);
      if (!config.includeMastered) {
        const mastered = await progress.getCorrectExerciseIds(config.topicIds);
        const unmastered = pool.filter((e) => !mastered.has(e.id));
        if (unmastered.length === 0 && pool.length > 0) {
          if (active)
            setEmptyReason(
              'Você já acertou todas as questões desses tópicos! 🎉 Desmarque "pular questões que já acertei" para revisar.',
            );
          return;
        }
        pool = unmastered;
      }
      const picked =
        config.questionCount === 'all'
          ? shuffle(pool)
          : shuffle(pool).slice(0, config.questionCount);
      if (active) setExercises(picked);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = exercises?.length ?? 0;
  const exercise = exercises?.[current];
  const currentChoice = chosen[current];

  const correctCount = useMemo(
    () =>
      exercises
        ? exercises.filter((ex, i) => chosen[i] === ex.answer).length
        : 0,
    [exercises, chosen],
  );

  if (!config && !state.retry) return <Navigate to="/exercicios" replace />;

  async function finish(finalChosen: number[]) {
    if (!exercises) return;
    setSaving(true);
    const now = new Date().toISOString();
    const attempts: AttemptRecord[] = exercises.map((ex, i) => ({
      exerciseId: ex.id,
      topicId: ex.topicId,
      chosen: finalChosen[i],
      isCorrect: finalChosen[i] === ex.answer,
      answeredAt: now,
    }));
    const correct = attempts.filter((a) => a.isCorrect).length;
    try {
      await progress.recordAttempts(attempts, {
        mode,
        topicIds: [...new Set(exercises.map((e) => e.topicId))],
        totalQuestions: exercises.length,
        correctCount: correct,
        startedAt,
        finishedAt: now,
      });
    } catch (err) {
      // não bloqueia o resultado se a gravação falhar
      console.error(err);
    }
    const result: SessionResultState = {
      exercises,
      chosen: finalChosen,
      mode,
    };
    navigate('/exercicios/resultado', { state: result, replace: true });
  }

  function choose(optionIndex: number) {
    if (mode === 'imediata' && revealed) return;
    const next = [...chosen];
    next[current] = optionIndex;
    setChosen(next);
    if (mode === 'imediata') setRevealed(true);
  }

  function advance() {
    if (current + 1 >= total) {
      void finish(chosen);
    } else {
      setCurrent(current + 1);
      setRevealed(false);
    }
  }

  if (emptyReason) {
    return (
      <div className="container session-container">
        <p className="empty-state">{emptyReason}</p>
        <button
          type="button"
          className="button-primary"
          onClick={() => navigate('/exercicios')}
        >
          ← Voltar e ajustar o treino
        </button>
      </div>
    );
  }

  if (!exercises) {
    return (
      <div className="container">
        <p className="empty-state">Preparando suas questões…</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="container session-container">
        <p className="empty-state">
          Nenhuma questão disponível para essa seleção.
        </p>
        <button
          type="button"
          className="button-primary"
          onClick={() => navigate('/exercicios')}
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const isLast = current + 1 === total;
  const answeredCurrent = currentChoice !== undefined;

  return (
    <div className="container session-container">
      <div className="session-top">
        <span className="session-mode">
          {mode === 'imediata' ? '⚡ Correção imediata' : '🎯 Simulado'}
        </span>
        <span className="session-count">
          {current + 1} / {total}
          {mode === 'imediata' && ` · ${correctCount} certas`}
        </span>
      </div>
      <div className="session-progress">
        <div
          className="session-progress-fill"
          style={{ width: `${((current + (answeredCurrent ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {exercise && (
        <div className="quiz session-quiz">
          <p className="quiz-prompt">
            <RichText text={exercise.question} />
          </p>
          <div className="quiz-options">
            {exercise.options.map((opt, oi) => {
              let cls = 'quiz-option';
              if (mode === 'imediata' && revealed) {
                if (oi === exercise.answer) cls += ' correct';
                else if (oi === currentChoice) cls += ' incorrect';
                else cls += ' disabled';
              } else if (currentChoice === oi) {
                cls += ' picked';
              }
              return (
                <button
                  type="button"
                  key={oi}
                  className={cls}
                  onClick={() => choose(oi)}
                  disabled={mode === 'imediata' && revealed}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {mode === 'imediata' && revealed && (
            <div
              className={`quiz-feedback ${
                currentChoice === exercise.answer ? 'ok' : 'nok'
              }`}
            >
              {currentChoice === exercise.answer
                ? '✓ Correto! '
                : '✗ Não foi dessa vez. '}
              <RichText text={exercise.explanation} />
            </div>
          )}

          <button
            type="button"
            className="button-primary session-next"
            disabled={!answeredCurrent || (mode === 'imediata' && !revealed) || saving}
            onClick={advance}
          >
            {saving
              ? 'Salvando…'
              : isLast
                ? mode === 'simulado'
                  ? 'Finalizar e corrigir'
                  : 'Ver resultado'
                : 'Próxima →'}
          </button>
        </div>
      )}
    </div>
  );
}
