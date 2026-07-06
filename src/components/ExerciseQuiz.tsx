import { useState } from 'react';
import type { Exercise } from '../domain/types';
import { RichText } from './RichText';

interface QuizState {
  /** índice da opção escolhida por questão (undefined = não respondida) */
  [questionIndex: number]: number;
}

export function ExerciseQuiz({ exercises }: { exercises: Exercise[] }) {
  const [answers, setAnswers] = useState<QuizState>({});

  if (exercises.length === 0) return null;

  const answered = Object.keys(answers).length;
  const correct = exercises.filter(
    (ex, i) => answers[i] === ex.answer,
  ).length;

  function choose(questionIndex: number, optionIndex: number) {
    setAnswers((prev) =>
      questionIndex in prev
        ? prev
        : { ...prev, [questionIndex]: optionIndex },
    );
  }

  return (
    <section className="quiz">
      <div className="quiz-header">
        <h2>✏️ Exercícios</h2>
        <span className="quiz-score">
          {answered === exercises.length
            ? `Resultado: ${correct}/${exercises.length}`
            : `${answered}/${exercises.length} respondidas`}
        </span>
      </div>

      {exercises.map((ex, qi) => {
        const chosen = answers[qi];
        const isAnswered = chosen !== undefined;
        return (
          <div className="quiz-question" key={qi}>
            <p className="quiz-prompt">
              <span className="quiz-number">{qi + 1}.</span>{' '}
              <RichText text={ex.question} />
            </p>
            <div className="quiz-options">
              {ex.options.map((opt, oi) => {
                let cls = 'quiz-option';
                if (isAnswered) {
                  if (oi === ex.answer) cls += ' correct';
                  else if (oi === chosen) cls += ' incorrect';
                  else cls += ' disabled';
                }
                return (
                  <button
                    type="button"
                    key={oi}
                    className={cls}
                    onClick={() => choose(qi, oi)}
                    disabled={isAnswered}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <div
                className={`quiz-feedback ${
                  chosen === ex.answer ? 'ok' : 'nok'
                }`}
              >
                {chosen === ex.answer ? '✓ Correto! ' : '✗ Não foi dessa vez. '}
                <RichText text={ex.explanation} />
              </div>
            )}
          </div>
        );
      })}

      {answered === exercises.length && (
        <button
          type="button"
          className="quiz-reset"
          onClick={() => setAnswers({})}
        >
          ↻ Refazer exercícios
        </button>
      )}
    </section>
  );
}
