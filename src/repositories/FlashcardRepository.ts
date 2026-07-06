import type { Accent } from '../domain/types';
import { supabase } from '../lib/supabase';

export interface FlashcardDeck {
  id: string;
  ownerId: string | null;
  slug: string | null;
  title: string;
  description: string;
  accent: Accent;
  cardCount: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  example: string | null;
}

export interface CardProgress {
  box: 1 | 2 | 3;
  dueAt: string;
  correct: number;
  wrong: number;
}

const LOCAL_KEY = 'ingles.flashcards.v1';
const BOX_INTERVAL_DAYS: Record<number, number> = { 1: 0, 2: 1, 3: 3 };

function nextProgress(prev: CardProgress | undefined, gotIt: boolean): CardProgress {
  const box = gotIt ? (Math.min(3, (prev?.box ?? 1) + 1) as 1 | 2 | 3) : 1;
  const due = new Date();
  due.setDate(due.getDate() + BOX_INTERVAL_DAYS[box]);
  return {
    box,
    dueAt: due.toISOString(),
    correct: (prev?.correct ?? 0) + (gotIt ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (gotIt ? 0 : 1),
  };
}

function loadLocal(): Record<string, CardProgress> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** Decks e cards no Supabase; progresso na conta (logado) ou localStorage (anônimo). */
export class FlashcardRepository {
  constructor(private userId: string | null) {}

  async getDecks(): Promise<FlashcardDeck[]> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('id, owner_id, slug, title, description, accent, flashcards(count)')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((d) => ({
      id: d.id,
      ownerId: d.owner_id,
      slug: d.slug,
      title: d.title,
      description: d.description,
      accent: d.accent as Accent,
      cardCount:
        (d.flashcards as unknown as { count: number }[])[0]?.count ?? 0,
    }));
  }

  async getDeck(id: string): Promise<{ deck: FlashcardDeck; cards: Flashcard[] } | null> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('id, owner_id, slug, title, description, accent, flashcards(id, deck_id, front, back, example, position)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const cards = (
      (data.flashcards ?? []) as {
        id: string; deck_id: string; front: string; back: string;
        example: string | null; position: number;
      }[]
    )
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        id: c.id,
        deckId: c.deck_id,
        front: c.front,
        back: c.back,
        example: c.example,
      }));
    return {
      deck: {
        id: data.id,
        ownerId: data.owner_id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        accent: data.accent as Accent,
        cardCount: cards.length,
      },
      cards,
    };
  }

  async createDeck(title: string, description: string, accent: Accent): Promise<string> {
    if (!this.userId) throw new Error('É preciso entrar para criar seus cards.');
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({ owner_id: this.userId, title, description, accent })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  }

  async deleteDeck(id: string): Promise<void> {
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async addCard(deckId: string, front: string, back: string, example: string | null): Promise<void> {
    const { error } = await supabase
      .from('flashcards')
      .insert({ deck_id: deckId, front, back, example, position: Date.now() % 1_000_000 });
    if (error) throw new Error(error.message);
  }

  async deleteCard(id: string): Promise<void> {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ---------- progresso ----------

  async getProgress(cardIds: string[]): Promise<Map<string, CardProgress>> {
    if (!this.userId) {
      const local = loadLocal();
      return new Map(
        cardIds.filter((id) => local[id]).map((id) => [id, local[id]]),
      );
    }
    const { data, error } = await supabase
      .from('flashcard_progress')
      .select('card_id, box, correct_count, wrong_count, due_at')
      .in('card_id', cardIds);
    if (error) throw new Error(error.message);
    return new Map(
      (data ?? []).map((r) => [
        r.card_id as string,
        {
          box: r.box as 1 | 2 | 3,
          dueAt: r.due_at,
          correct: r.correct_count,
          wrong: r.wrong_count,
        },
      ]),
    );
  }

  async recordReview(cardId: string, gotIt: boolean): Promise<void> {
    if (!this.userId) {
      const local = loadLocal();
      local[cardId] = nextProgress(local[cardId], gotIt);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
      return;
    }
    const current = (await this.getProgress([cardId])).get(cardId);
    const next = nextProgress(current, gotIt);
    const { error } = await supabase.from('flashcard_progress').upsert({
      user_id: this.userId,
      card_id: cardId,
      box: next.box,
      correct_count: next.correct,
      wrong_count: next.wrong,
      due_at: next.dueAt,
      last_reviewed_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }
}

/** Ordena para estudo: vencidos primeiro (box menor antes), depois os demais. */
export function orderForStudy(
  cards: Flashcard[],
  progress: Map<string, CardProgress>,
): Flashcard[] {
  const now = new Date().toISOString();
  const score = (c: Flashcard) => {
    const p = progress.get(c.id);
    if (!p) return 0; // nunca visto: junto dos vencidos
    if (p.dueAt <= now) return p.box; // vencido: box 1 antes de 2 e 3
    return 10 + p.box; // ainda não vencido: por último
  };
  return [...cards].sort((a, b) => score(a) - score(b));
}
