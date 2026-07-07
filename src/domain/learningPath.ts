/**
 * Trilha de aprendizado: ordena os tópicos do mais básico ao mais avançado,
 * agrupados em três níveis. É uma curadoria pedagógica (revisável) mantida no
 * front — não depende do banco. Tópicos que não estiverem aqui aparecem no
 * fim, num grupo "Outros", para nada sumir da trilha.
 */
export interface PathLevel {
  level: 1 | 2 | 3;
  label: string;
  description: string;
  /** Ordem de estudo dentro do nível. */
  topicIds: string[];
}

export const LEARNING_PATH: PathLevel[] = [
  {
    level: 1,
    label: 'Nível 1 · Fundamentos',
    description: 'O básico para montar frases: artigos, presente e passado simples.',
    topicIds: [
      'a-vs-an',
      'have-has-there-is',
      'present-simple',
      'some-vs-any',
      'countable-uncountable',
      'was-were',
      'past-simple',
    ],
  },
  {
    level: 2,
    label: 'Nível 2 · Intermediário',
    description: 'Tempos contínuos, comparações, futuro e presente perfeito.',
    topicIds: [
      'present-continuous',
      'past-continuous',
      'comparatives-superlatives',
      'too-much-vs-too-many',
      'will-vs-going-to',
      'present-perfect',
      'used-to',
      'may-might-could-would',
      'like-vs-as',
    ],
  },
  {
    level: 3,
    label: 'Nível 3 · Avançado',
    description: 'Passado perfeito, condicionais, voz passiva e orações relativas.',
    topicIds: [
      'past-perfect',
      'past-perfect-continuous',
      'have-been-vs-had-been',
      'conditionals',
      'prefer-vs-would-rather',
      'passive-voice',
      'relative-clauses',
    ],
  },
];

/** Todos os ids que aparecem na trilha, em ordem. */
export const PATH_TOPIC_IDS: string[] = LEARNING_PATH.flatMap((l) => l.topicIds);
