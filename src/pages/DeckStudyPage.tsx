import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FlashcardRepository,
  orderForStudy,
  type Flashcard,
  type FlashcardDeck,
} from '../repositories/FlashcardRepository';

export function DeckStudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const repo = useMemo(() => new FlashcardRepository(user?.id ?? null), [user]);

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ right: 0, wrong: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [example, setExample] = useState('');

  const isOwner = deck !== null && deck.ownerId !== null && deck.ownerId === user?.id;

  async function load() {
    if (!deckId) return;
    setLoading(true);
    try {
      const result = await repo.getDeck(deckId);
      if (!result) {
        setError('Grupo de cards não encontrado.');
        return;
      }
      const progress = await repo.getProgress(result.cards.map((c) => c.id));
      setDeck(result.deck);
      setQueue(orderForStudy(result.cards, progress));
      setIndex(0);
      setFlipped(false);
      setResults({ right: 0, wrong: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, repo]);

  function answer(gotIt: boolean) {
    const card = queue[index];
    void repo.recordReview(card.id, gotIt).catch(console.error);
    setResults((r) => ({
      right: r.right + (gotIt ? 1 : 0),
      wrong: r.wrong + (gotIt ? 0 : 1),
    }));
    setFlipped(false);
    setIndex(index + 1);
  }

  async function handleAddCard(e: FormEvent) {
    e.preventDefault();
    if (!deckId) return;
    try {
      await repo.addCard(deckId, front.trim(), back.trim(), example.trim() || null);
      setFront('');
      setBack('');
      setExample('');
      await load();
      setAdding(true); // continua no formulário para adicionar vários
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p className="empty-state">Embaralhando os cards…</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="container">
        <p className="empty-state">{error ?? 'Grupo de cards não encontrado.'}</p>
        <Link className="button-ghost" to="/flashcards">
          ← Voltar aos cards
        </Link>
      </div>
    );
  }

  const card = queue[index];
  const done = index >= queue.length;

  return (
    <div className={`container session-container accent-${deck.accent}`}>
      <div className="topic-nav">
        <Link to="/flashcards" className="back-link">
          ← Cards
        </Link>
        <span className="tag">{deck.title}</span>
      </div>

      {queue.length === 0 ? (
        <p className="empty-state">
          Este grupo ainda não tem cards.
          {isOwner && ' Adicione o primeiro abaixo!'}
        </p>
      ) : done ? (
        <div className="home-header">
          <div className="label">Rodada concluída</div>
          <h1>
            {results.right}/{queue.length} <span className="accent">✓</span>
          </h1>
          <p className="subtitle">
            {results.wrong > 0
              ? `Os ${results.wrong} que você errou voltarão primeiro na próxima rodada.`
              : 'Você acertou tudo! 🎉'}
          </p>
          <div className="result-actions">
            <button type="button" className="button-primary" onClick={() => void load()}>
              ↻ Estudar de novo
            </button>
            <Link className="button-ghost" to="/flashcards">
              Outros cards
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="session-top">
            <span className="session-mode">🃏 {deck.title}</span>
            <span className="session-count">
              {index + 1} / {queue.length} · {results.right}✓ {results.wrong}✗
            </span>
          </div>
          <div className="session-progress">
            <div
              className="session-progress-fill"
              style={{ width: `${(index / queue.length) * 100}%` }}
            />
          </div>

          <button
            type="button"
            className={`flashcard ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <span className="flashcard-inner">
              <span className="flashcard-face flashcard-front">
                <small>Inglês · toque para virar</small>
                {card.front}
              </span>
              <span className="flashcard-face flashcard-back">
                <small>Português</small>
                {card.back}
                {card.example && <em>“{card.example}”</em>}
              </span>
            </span>
          </button>

          {flipped ? (
            <div className="flashcard-actions">
              <button
                type="button"
                className="flashcard-btn nok"
                onClick={() => answer(false)}
              >
                ✗ Errei
              </button>
              <button
                type="button"
                className="flashcard-btn ok"
                onClick={() => answer(true)}
              >
                ✓ Acertei
              </button>
            </div>
          ) : (
            <p className="flashcard-hint">
              Pense na resposta e toque no card para conferir
            </p>
          )}
        </>
      )}

      {isOwner && (
        <section className="stats-section deck-manage">
          {!adding ? (
            <button type="button" className="button-ghost" onClick={() => setAdding(true)}>
              + Adicionar card a este grupo
            </button>
          ) : (
            <form className="auth-card deck-form" onSubmit={handleAddCard}>
              <label className="auth-field">
                Frente (inglês)
                <input
                  required
                  maxLength={120}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="ex.: to look forward to"
                />
              </label>
              <label className="auth-field">
                Verso (português)
                <input
                  required
                  maxLength={200}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="ex.: estar ansioso por / aguardar com expectativa"
                />
              </label>
              <label className="auth-field">
                Exemplo em inglês (opcional)
                <input
                  maxLength={200}
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder="ex.: I'm looking forward to seeing you!"
                />
              </label>
              <button className="button-primary" type="submit">
                Adicionar card
              </button>
              <button
                className="button-ghost"
                type="button"
                onClick={() => setAdding(false)}
              >
                Fechar
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
