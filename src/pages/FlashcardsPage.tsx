import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LoginCta } from '../components/LoginCta';
import { useAuth } from '../contexts/AuthContext';
import type { Accent } from '../domain/types';
import {
  FlashcardRepository,
  type FlashcardDeck,
} from '../repositories/FlashcardRepository';

const ACCENTS: Accent[] = ['blue', 'orange', 'purple', 'green', 'pink', 'teal'];

export function FlashcardsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const repo = useMemo(() => new FlashcardRepository(user?.id ?? null), [user]);
  const [decks, setDecks] = useState<FlashcardDeck[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accent, setAccent] = useState<Accent>('blue');

  const refresh = useCallback(() => {
    repo
      .getDecks()
      .then(setDecks)
      .catch((e: Error) => setError(e.message));
  }, [repo]);

  useEffect(refresh, [refresh]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await repo.createDeck(title.trim(), description.trim(), accent);
      setTitle('');
      setDescription('');
      setCreating(false);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(deck: FlashcardDeck) {
    if (!window.confirm(`Excluir "${deck.title}" e todos os cards dentro dele?`)) return;
    try {
      await repo.deleteDeck(deck.id);
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const seedDecks = (decks ?? []).filter((d) => d.ownerId === null);
  const myDecks = (decks ?? []).filter((d) => d.ownerId !== null);

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Memorização</div>
        <h1>
          Flash<span className="accent">cards</span>
        </h1>
        <p className="subtitle">
          Vire o card, responda se acertou — os que você erra voltam antes
        </p>
      </header>

      <LoginCta />
      {error && <p className="auth-error">{error}</p>}

      {decks === null ? (
        <p className="empty-state">Carregando cards…</p>
      ) : (
        <>
          <section className="stats-section">
            <h2 className="setup-title">Cards prontos</h2>
            <div className="deck-grid">
              {seedDecks.map((d) => (
                <Link
                  key={d.id}
                  to={`/flashcards/${d.id}`}
                  className={`hub-card accent-${d.accent}`}
                >
                  <h2>{d.title}</h2>
                  <p>{d.description}</p>
                  <span className="deck-count">{d.cardCount} cards</span>
                </Link>
              ))}
              {seedDecks.length === 0 && (
                <p className="empty-state">Nenhum card disponível ainda.</p>
              )}
            </div>
          </section>

          <section className="stats-section">
            <div className="setup-title-row">
              <h2 className="setup-title">Meus cards</h2>
              {user && !creating && (
                <button
                  type="button"
                  className="chip"
                  onClick={() => setCreating(true)}
                >
                  + Novo grupo de cards
                </button>
              )}
            </div>

            {!user ? (
              <p className="auth-hint">
                <Link to="/entrar" state={{ from: location.pathname }}>
                  <strong>Entre na sua conta</strong>
                </Link>{' '}
                para criar os seus próprios cards.
              </p>
            ) : (
              <>
                {creating && (
                  <form className="auth-card deck-form" onSubmit={handleCreate}>
                    <label className="auth-field">
                      Nome do grupo de cards
                      <input
                        required
                        maxLength={60}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="ex.: Vocabulário da aula 12"
                      />
                    </label>
                    <label className="auth-field">
                      Descrição (opcional)
                      <input
                        maxLength={120}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="do que são esses cards?"
                      />
                    </label>
                    <div className="category-chips">
                      {ACCENTS.map((a) => (
                        <button
                          type="button"
                          key={a}
                          className={`chip accent-chip-${a} ${accent === a ? 'active' : ''}`}
                          onClick={() => setAccent(a)}
                        >
                          ●
                        </button>
                      ))}
                    </div>
                    <button className="button-primary" type="submit">
                      Criar grupo de cards
                    </button>
                    <button
                      className="button-ghost"
                      type="button"
                      onClick={() => setCreating(false)}
                    >
                      Cancelar
                    </button>
                  </form>
                )}

                <div className="deck-grid">
                  {myDecks.map((d) => (
                    <div key={d.id} className={`hub-card accent-${d.accent} deck-own`}>
                      <Link to={`/flashcards/${d.id}`} className="deck-own-link">
                        <h2>{d.title}</h2>
                        <p>{d.description || 'Cards pessoais'}</p>
                        <span className="deck-count">{d.cardCount} cards</span>
                      </Link>
                      <button
                        type="button"
                        className="deck-delete"
                        title="Excluir este grupo de cards"
                        onClick={() => handleDelete(d)}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
                {myDecks.length === 0 && !creating && (
                  <p className="empty-state">
                    Você ainda não criou nenhum card. Que tal começar com o
                    vocabulário da sua última aula?
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
