-- Schema inicial: conteúdo de estudo, exercícios, progresso, flashcards e cache do dicionário.
-- Conteúdo é escrito apenas via service role (scripts/seed.mjs); o app só lê.

-- =============== CONTEÚDO ===============

create table public.topics (
  id              text primary key,
  title           text not null,
  title_highlight text,
  subtitle        text not null,
  category        text not null check (category in ('tenses','conditionals','versus','basics','structures')),
  tags            text[] not null default '{}',
  blocks          jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.exercises (
  id          uuid primary key default gen_random_uuid(),
  topic_id    text not null references public.topics(id) on delete cascade,
  question    text not null,
  -- A resposta correta fica legível pelo cliente: correção é client-side,
  -- tradeoff aceito para um app de estudo sem ranking competitivo.
  options     jsonb not null,
  answer      smallint not null check (answer between 0 and 3),
  explanation text not null,
  difficulty  smallint not null default 2 check (difficulty between 1 and 3),
  source      text not null default 'seed-v1',
  seed_key    text unique,
  created_at  timestamptz not null default now()
);
create index exercises_topic_id_idx on public.exercises (topic_id);

-- =============== SESSÕES E TENTATIVAS ===============

create table public.exercise_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  mode            text not null check (mode in ('imediata','simulado')),
  topic_ids       text[] not null,
  total_questions int not null,
  correct_count   int,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz
);
create index exercise_sessions_user_idx on public.exercise_sessions (user_id, started_at desc);

create table public.answer_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  topic_id    text not null,
  session_id  uuid references public.exercise_sessions(id) on delete set null,
  chosen      smallint not null,
  is_correct  boolean not null,
  answered_at timestamptz not null default now()
);
create index answer_attempts_user_ex_idx    on public.answer_attempts (user_id, exercise_id);
create index answer_attempts_user_topic_idx on public.answer_attempts (user_id, topic_id);
create index answer_attempts_user_date_idx  on public.answer_attempts (user_id, answered_at desc);

-- =============== CACHE DO DICIONÁRIO ===============

create table public.dictionary_cache (
  term         text not null,
  direction    text not null check (direction in ('en-pt','pt-en')),
  entry        jsonb not null,
  model        text not null,
  lookup_count int not null default 1,
  created_at   timestamptz not null default now(),
  primary key (term, direction)
);

-- =============== FLASHCARDS ===============

create table public.flashcard_decks (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade,  -- NULL = deck público de seed
  slug        text unique,
  title       text not null,
  description text not null default '',
  accent      text not null default 'blue',
  created_at  timestamptz not null default now()
);

create table public.flashcards (
  id         uuid primary key default gen_random_uuid(),
  deck_id    uuid not null references public.flashcard_decks(id) on delete cascade,
  front      text not null,
  back       text not null,
  example    text,
  position   int not null default 0,
  seed_key   text unique,
  created_at timestamptz not null default now()
);
create index flashcards_deck_idx on public.flashcards (deck_id, position);

create table public.flashcard_progress (
  user_id          uuid not null references auth.users(id) on delete cascade,
  card_id          uuid not null references public.flashcards(id) on delete cascade,
  box              smallint not null default 1 check (box between 1 and 3),
  correct_count    int not null default 0,
  wrong_count      int not null default 0,
  last_reviewed_at timestamptz,
  due_at           timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- =============== RLS ===============

alter table public.topics             enable row level security;
alter table public.exercises          enable row level security;
alter table public.exercise_sessions  enable row level security;
alter table public.answer_attempts    enable row level security;
alter table public.dictionary_cache   enable row level security;
alter table public.flashcard_decks    enable row level security;
alter table public.flashcards         enable row level security;
alter table public.flashcard_progress enable row level security;

create policy "topics_read"    on public.topics           for select to anon, authenticated using (true);
create policy "exercises_read" on public.exercises        for select to anon, authenticated using (true);
create policy "dict_read"      on public.dictionary_cache for select to anon, authenticated using (true);

create policy "sessions_own" on public.exercise_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "attempts_own" on public.answer_attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "decks_read" on public.flashcard_decks
  for select to anon, authenticated using (owner_id is null or owner_id = auth.uid());
create policy "decks_insert" on public.flashcard_decks
  for insert to authenticated with check (owner_id = auth.uid());
create policy "decks_update" on public.flashcard_decks
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "decks_delete" on public.flashcard_decks
  for delete to authenticated using (owner_id = auth.uid());

create policy "cards_read" on public.flashcards
  for select to anon, authenticated using (
    exists (select 1 from public.flashcard_decks d
            where d.id = deck_id and (d.owner_id is null or d.owner_id = auth.uid())));
create policy "cards_write" on public.flashcards
  for all to authenticated using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.owner_id = auth.uid()))
  with check (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.owner_id = auth.uid()));

create policy "fc_progress_own" on public.flashcard_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============== VIEWS DE ESTATÍSTICA ===============
-- security_invoker: as views respeitam o RLS do usuário que consulta.

create view public.user_topic_stats with (security_invoker = true) as
  select user_id, topic_id,
         count(*) as attempts,
         count(*) filter (where is_correct) as correct,
         round(100.0 * count(*) filter (where is_correct) / count(*), 1) as accuracy_pct
  from public.answer_attempts
  group by user_id, topic_id;

create view public.user_daily_stats with (security_invoker = true) as
  select user_id,
         (answered_at at time zone 'America/Sao_Paulo')::date as day,
         count(*) as attempts,
         count(*) filter (where is_correct) as correct
  from public.answer_attempts
  group by 1, 2;

create view public.user_hardest_exercises with (security_invoker = true) as
  select user_id, exercise_id, topic_id,
         count(*) as attempts,
         count(*) filter (where not is_correct) as wrong,
         round(100.0 * count(*) filter (where not is_correct) / count(*), 1) as error_pct
  from public.answer_attempts
  group by user_id, exercise_id, topic_id
  having count(*) filter (where not is_correct) > 0;
