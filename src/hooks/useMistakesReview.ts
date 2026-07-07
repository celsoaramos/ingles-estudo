import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildMistakesSession } from '../services/mistakesReview';
import { useProgressRepository } from './useProgressRepository';

/**
 * Inicia uma sessão de "refazer meus erros": busca as questões erradas e
 * navega direto para a sessão de exercícios no modo de correção imediata.
 * `start()` resolve para `false` se não houver erros a revisar.
 */
export function useMistakesReview() {
  const progress = useProgressRepository();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  async function start(): Promise<boolean> {
    setStarting(true);
    try {
      const exercises = await buildMistakesSession(progress);
      if (exercises.length === 0) return false;
      navigate('/exercicios/sessao', {
        state: { retry: { exercises, mode: 'imediata' } },
      });
      return true;
    } finally {
      setStarting(false);
    }
  }

  return { start, starting };
}
