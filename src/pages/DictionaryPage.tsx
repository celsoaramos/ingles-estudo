import { useState, type FormEvent } from 'react';
import {
  lookupWord,
  type DictionaryEntry,
  type Direction,
} from '../services/dictionary';

const RECENT_KEY = 'ingles.dictionary.recent';
const MAX_RECENT = 8;

function loadRecent(): { term: string; direction: Direction }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function DictionaryPage() {
  const [term, setTerm] = useState('');
  const [direction, setDirection] = useState<Direction>('en-pt');
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState(loadRecent);

  async function search(searchTerm: string, searchDirection: Direction) {
    const q = searchTerm.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setEntry(null);
    try {
      const result = await lookupWord(q, searchDirection);
      setEntry(result.entry);
      if (result.entry.found) {
        const next = [
          { term: result.entry.term, direction: searchDirection },
          ...loadRecent().filter(
            (r) => !(r.term === result.entry.term && r.direction === searchDirection),
          ),
        ].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        setRecent(next);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void search(term, direction);
  }

  return (
    <div className="container session-container">
      <header className="home-header">
        <div className="label">Vocabulário</div>
        <h1>
          Dicio<span className="accent">nário</span>
        </h1>
        <p className="subtitle">
          📖 Dicionário, não tradutor — busque <strong>palavras ou
          expressões curtas</strong> e veja tradução, contexto, exemplos e
          combinações comuns.
        </p>
      </header>

      <form className="dict-form" onSubmit={handleSubmit}>
        <div className="auth-tabs dict-direction">
          <button
            type="button"
            className={direction === 'en-pt' ? 'active' : ''}
            onClick={() => setDirection('en-pt')}
          >
            Inglês → Português
          </button>
          <button
            type="button"
            className={direction === 'pt-en' ? 'active' : ''}
            onClick={() => setDirection('pt-en')}
          >
            Português → Inglês
          </button>
        </div>
        <div className="dict-search-row">
          <input
            className="search-input dict-input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={
              direction === 'en-pt' ? 'ex.: run out of' : 'ex.: saudade'
            }
            maxLength={60}
            autoFocus
          />
          <button className="button-primary dict-go" type="submit" disabled={loading}>
            {loading ? '…' : 'Buscar'}
          </button>
        </div>
      </form>

      {recent.length > 0 && !entry && !loading && (
        <div className="category-chips dict-recent">
          {recent.map((r) => (
            <button
              type="button"
              key={`${r.direction}:${r.term}`}
              className="chip"
              onClick={() => {
                setTerm(r.term);
                setDirection(r.direction);
                void search(r.term, r.direction);
              }}
            >
              {r.term}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="empty-state">Consultando o dicionário…</p>
      )}
      {error && <p className="auth-error">{error}</p>}

      {entry && !entry.found && (
        <p className="empty-state">
          Não encontrei "{entry.term}". Confira a grafia — e lembre que aqui é
          dicionário de palavras, não tradutor de frases.
        </p>
      )}

      {entry?.found && (
        <article className="dict-entry">
          <h2 className="dict-term">{entry.term}</h2>
          {entry.note && <p className="dict-note">⚠️ {entry.note}</p>}

          {entry.entries.map((sense, i) => (
            <section className="dict-sense" key={i}>
              <div className="dict-sense-head">
                <span className="dict-pos">{sense.partOfSpeech}</span>
                <strong className="dict-translation">{sense.translation}</strong>
              </div>
              <p className="dict-context">{sense.sense}</p>
              {sense.examples.map((ex, j) => (
                <div className="example" key={j}>
                  <div className="example-en">{ex.en}</div>
                  <div className="example-pt">{ex.pt}</div>
                </div>
              ))}
            </section>
          ))}

          {entry.collocations.length > 0 && (
            <section className="dict-sense">
              <p className="examples-title">Combinações comuns</p>
              <div className="category-chips">
                {entry.collocations.map((c) => (
                  <span className="pill" key={c}>
                    {c}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>
      )}
    </div>
  );
}
