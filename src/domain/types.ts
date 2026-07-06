/**
 * Modelo de domínio dos assuntos de estudo.
 *
 * O conteúdo de cada assunto é uma lista de blocos genéricos (Block),
 * renderizados por componentes de apresentação. Texto dentro de exemplos,
 * células de tabela, dicas etc. aceita a marcação:
 *   **palavra**  -> destaque na cor do card
 *   `texto`      -> fonte monoespaçada (fórmulas)
 */

export type CategoryId =
  | 'tenses'
  | 'conditionals'
  | 'versus'
  | 'basics'
  | 'structures';

export interface Category {
  id: CategoryId;
  label: string;
}

export type Accent =
  | 'blue'
  | 'orange'
  | 'purple'
  | 'green'
  | 'pink'
  | 'teal'
  | 'yellow';

export interface FormulaRow {
  /** Rótulo à esquerda, ex.: "Afirmativa →" */
  label?: string;
  /** Fórmula em si, ex.: "Sujeito + **verbo base**" */
  value: string;
}

export interface Example {
  en: string;
  pt: string;
}

export interface CardBlock {
  type: 'card';
  accent: Accent;
  /** Conteúdo do quadradinho ao lado do título: "1", "✓", "vs"... */
  badge: string;
  title: string;
  subtitle?: string;
  formula?: FormulaRow[];
  examples?: Example[];
  /** Pills de pontos-chave no rodapé do card */
  keyPoints?: string[];
}

export interface TableBlock {
  type: 'table';
  title: string;
  headers: string[];
  rows: string[][];
}

export interface MistakeItem {
  wrong: string;
  right: string;
  /** Observação curta exibida junto do erro */
  note?: string;
}

export interface MistakesBlock {
  type: 'mistakes';
  title?: string;
  items: MistakeItem[];
}

export interface TipBlock {
  type: 'tip';
  text: string;
}

export type Block = CardBlock | TableBlock | MistakesBlock | TipBlock;

export type Difficulty = 1 | 2 | 3;

export interface Exercise {
  /** UUID estável no banco — base do rastreio de acertos por usuário */
  id: string;
  topicId: string;
  question: string;
  options: string[];
  /** Índice da opção correta em options */
  answer: number;
  explanation: string;
  difficulty: Difficulty;
}

/** 'imediata': corrige a cada resposta · 'simulado': corrige tudo no final */
export type SessionMode = 'imediata' | 'simulado';

export interface QuizConfig {
  topicIds: string[];
  mode: SessionMode;
  /** false = excluir questões que o usuário já acertou alguma vez */
  includeMastered: boolean;
  questionCount: number | 'all';
}

export interface AttemptRecord {
  exerciseId: string;
  topicId: string;
  chosen: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface SessionSummary {
  mode: SessionMode;
  topicIds: string[];
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  finishedAt: string;
}

export interface Topic {
  id: string;
  title: string;
  /** Parte do título pintada com a cor de destaque */
  titleHighlight?: string;
  subtitle: string;
  category: CategoryId;
  /** Usadas na busca e exibidas no card da lista */
  tags: string[];
  blocks: Block[];
  exercises: Exercise[];
}

/** Versão enxuta para a listagem/filtos */
export interface TopicSummary {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryId;
  tags: string[];
  exerciseCount: number;
}
