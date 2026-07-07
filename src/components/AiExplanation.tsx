import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Exercise } from '../domain/types';
import { explainExercise, type Explanation } from '../services/explain';
import { RichText } from './RichText';

type Status = 'idle' | 'login' | 'loading' | 'done' | 'error';

/**
 * Botão "Me explica melhor" + explicação gerada por IA para uma questão.
 * Só aparece para usuários logados (a Edge Function exige conta) e o
 * resultado é cacheado por exercício no backend.
 */
export function AiExplanation({ exercise }: { exercise: Exercise }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [content, setContent] = useState<Explanation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function ask() {
    if (!user) {
      setStatus('login');
      return;
    }
    setStatus('loading');
    try {
      const res = await explainExercise(exercise);
      setContent(res.content);
      setStatus('done');
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus('error');
    }
  }

  if (status === 'idle' || status === 'login') {
    return (
      <>
        <button
          type="button"
          className="ai-explain-btn"
          onClick={() => void ask()}
        >
          🤖 Me explica melhor
        </button>
        {status === 'login' && (
          <p className="ai-explain-login">
            A explicação com IA é para quem tem conta.{' '}
            <Link to="/entrar">Entre ou crie a sua</Link> — é grátis e leva 10s.
          </p>
        )}
      </>
    );
  }

  if (status === 'loading') {
    return <p className="ai-explain-loading">🤖 Preparando a explicação…</p>;
  }

  if (status === 'error') {
    return (
      <div className="ai-explain error">
        <p>{errorMsg}</p>
        <button type="button" className="ai-explain-retry" onClick={() => void ask()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="ai-explain">
      <div className="ai-explain-head">🤖 Explicação</div>
      <p className="ai-explain-text">
        <RichText text={content.explanation} />
      </p>

      {content.commonMistakes && (
        <p className="ai-explain-text ai-explain-mistakes">
          <strong>Onde costuma escorregar:</strong>{' '}
          <RichText text={content.commonMistakes} />
        </p>
      )}

      {content.examples.length > 0 && (
        <ul className="ai-explain-examples">
          {content.examples.map((ex, i) => (
            <li key={i}>
              <span className="ai-explain-en">{ex.en}</span>
              <span className="ai-explain-pt">{ex.pt}</span>
            </li>
          ))}
        </ul>
      )}

      {content.tip && (
        <p className="ai-explain-tip">
          💡 <RichText text={content.tip} />
        </p>
      )}
    </div>
  );
}
