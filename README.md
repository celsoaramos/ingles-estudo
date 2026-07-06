# Inglês · Estudo

Plataforma de estudo de inglês para quem faz curso — direto ao ponto, sem enrolação. Material de apoio; não substitui o curso.

**Áreas:** resumos de gramática por tópico · exercícios configuráveis (treino ou simulado) · flashcards (decks prontos + criação livre) · dicionário EN↔PT com contexto e exemplos · vídeos de canais selecionados do YouTube · estatísticas de acertos/erros por tópico (com login opcional).

## Rodando

```bash
npm install
cp .env.example .env   # preencha com as credenciais do Supabase
npm run dev            # desenvolvimento
npm run build          # build de produção (dist/)
npm run seed           # (re)popula o Supabase a partir de supabase/seed/
```

## Arquitetura

Front React 18 + Vite + TypeScript (SPA estática, HashRouter). Backend é o **Supabase**: Postgres com RLS (conteúdo público para leitura; dados de usuário isolados por conta), Auth por e-mail+senha e uma Edge Function para o dicionário.

```
src/
  domain/          # tipos do domínio
  lib/supabase.ts  # cliente único do Supabase
  contexts/        # AuthContext (login opcional)
  repositories/    # acesso a dados (Repository pattern)
    SupabaseTopicRepository   # tópicos + exercícios (leitura)
    ExerciseRepository        # questões para sessões de treino
    ProgressRepository        # progresso: Local (anônimo) / Supabase (logado)
    FlashcardRepository       # decks, cards e progresso Leitner
    StatsRepository           # views de estatística
  services/        # dictionary (Edge Function), youtube, merge de progresso
  hooks/           # useTopics, useTopicFilter, useProgressRepository
  components/      # blocos de conteúdo, quiz, layout, CTA de login
  pages/           # Home (hub), Topics, Topic, Exercises*, Flashcards*,
                   # Dictionary, Videos, Stats, Login
  styles/          # CSS global (tema dark, mobile-first)

supabase/
  migrations/      # schema (tabelas, RLS, views) — aplicar com db push
  seed/topics/     # conteúdo didático + exercícios originais (fonte de verdade)
  seed/exercises/  # expansão do banco de questões (um JSON por tópico)
  seed/decks/      # decks de flashcards públicos
  functions/dictionary/  # Edge Function do dicionário (gpt-5-mini + cache)
```

- **Fonte de verdade do conteúdo são os JSONs de seed** (versionados no git).
  Nunca edite conteúdo direto no Studio: altere o JSON e rode `npm run seed`
  (idempotente — a identidade de cada questão é um hash de pergunta+opções).
- **Progresso anônimo** fica em localStorage e é migrado para a conta no
  primeiro login (one-way, uma vez).
- **Rotas** com hash (`/#/exercicios`), então o build estático funciona em
  qualquer hospedagem sem configuração de servidor.

## Variáveis de ambiente

Veja `.env.example`. Cliente (vão para o bundle): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_YOUTUBE_API_KEY` (restrinja por HTTP referrer).
Servidor (apenas seed/CLI, nunca importar em `src/`): `SUPABASE_SERVICE_ROLE_KEY`,
`DATABASE_URL`, `DIRECT_URL`.

## Operações no Supabase

```bash
# aplicar migrations no banco remoto
set -a; source .env; set +a
supabase db push --db-url "$DIRECT_URL"

# dicionário: secret da API da OpenAI + deploy da função
supabase secrets set OPENAI_API_KEY=sk-... --project-ref <ref>
supabase functions deploy dictionary --project-ref <ref>
```

No painel do Supabase (Auth → Sign In/Up), recomenda-se **desativar
"Confirm email"**: evita o link de confirmação, que conflita com o HashRouter.

## Adicionando conteúdo

- **Assunto novo:** crie `supabase/seed/topics/<id>.json` seguindo
  [docs/content-spec.md](docs/content-spec.md) e rode `npm run seed`.
- **Mais questões para um tópico:** adicione em
  `supabase/seed/exercises/<topic-id>.json` (array de `{question, options,
  answer, explanation, difficulty}`) e rode `npm run seed`.
- **Deck de flashcards público:** crie `supabase/seed/decks/<slug>.json` e
  rode `npm run seed`.
