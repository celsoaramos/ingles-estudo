# Especificação de conteúdo — assuntos (supabase/seed/topics/*.json)

Cada assunto é um arquivo JSON em `supabase/seed/topics/`. O arquivo `conditionals.json` é o exemplo de referência — siga exatamente o mesmo estilo.

**O banco (Supabase) é populado a partir destes arquivos** com `npm run seed`
(idempotente). Nunca edite conteúdo direto no Studio — a identidade de cada
questão é um hash de pergunta+opções; editar no banco quebra o vínculo com o
seed e some no próximo `npm run seed`.

Questões extras (além das do arquivo do tópico) vivem em
`supabase/seed/exercises/<topic-id>.json` — um array de exercícios com o mesmo
schema abaixo, mais o campo `difficulty` (1 fácil · 2 médio · 3 difícil).

## Filosofia do conteúdo

- **Simples e direto ao ponto.** Não é um curso de inglês; é uma leitura rápida / mapa mental para quem já está fazendo curso.
- Explicações e subtítulos em **português (PT-BR)**; frases de exemplo em **inglês com tradução em PT**.
- Cada assunto: 1 a 4 cards, 1 tabela comparativa quando fizer sentido, 1 bloco de erros comuns, 1 a 3 dicas e 4 a 6 exercícios.

## Schema

```jsonc
{
  "id": "kebab-case, igual ao nome do arquivo sem .json",
  "title": "Título exibido",
  "titleHighlight": "trecho do title pintado na cor de destaque (opcional, deve ser substring exata do title)",
  "subtitle": "resumo de uma linha em PT",
  "category": "tenses | conditionals | versus | basics | structures",
  "tags": ["palavras para busca, en e pt"],
  "blocks": [ /* lista ordenada de blocos, tipos abaixo */ ],
  "exercises": [
    {
      "question": "frase com lacuna ___ ou pergunta direta",
      "options": ["4 opções"],
      "answer": 0,            // índice da correta (varie a posição!)
      "explanation": "por que a resposta é essa, em PT, curta"
    }
  ]
}
```

### Blocos

```jsonc
// Card de explicação (principal)
{
  "type": "card",
  "accent": "blue | orange | purple | green | pink | teal | yellow",
  "badge": "1", // ou "✓", "vs", "A", abreviação curta
  "title": "Nome do conceito (em inglês, ex.: Present Simple)",
  "subtitle": "quando usar, em PT, uma linha",
  "formula": [ { "label": "Afirmativa →", "value": "Sujeito + **verbo**" } ],
  "examples": [ { "en": "She **works** here.", "pt": "Ela trabalha aqui." } ],
  "keyPoints": ["até 3 pills curtas em PT"]
}

// Tabela comparativa
{ "type": "table", "title": "Comparativo Rápido", "headers": [...], "rows": [[...], ...] }

// Erros comuns (pares errado/certo)
{ "type": "mistakes", "items": [ { "wrong": "…", "right": "…", "note": "motivo curto" } ] }

// Dica
{ "type": "tip", "text": "texto em PT, pode conter marcação" }
```

### Marcação de texto (vale em examples, formula.value, células de tabela, tips, mistakes, explanation)

- `**palavra**` → destaque na cor do card (use nas palavras-chave gramaticais da frase)
- `` `texto` `` → fonte monoespaçada (fórmulas, trechos literais)

## Convenções

- Em cada card, escolha um `accent` diferente dos outros cards do mesmo assunto.
- Nos exemplos, destaque com `**…**` somente as palavras que ilustram o conceito.
- Nos exercícios, varie o índice da resposta correta e cubra os pontos dos cards.
- IDs de categoria: `tenses` (tempos verbais), `conditionals`, `versus` (um vs outro), `basics` (fundamentos), `structures` (voz passiva, relative clauses etc.).
