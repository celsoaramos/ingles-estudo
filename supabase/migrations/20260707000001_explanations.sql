-- Cache das explicações de IA por exercício.
-- Chave = exercise_id: a IA roda no máximo uma vez por questão; os demais
-- acessos batem no cache, mantendo o custo praticamente fixo.
-- Escrita é feita pela Edge Function `explain` com a service-role key (ignora RLS).
-- Leitura só para usuários autenticados (o recurso é exclusivo de quem tem conta).

create table public.explanation_cache (
  exercise_id  uuid primary key references public.exercises(id) on delete cascade,
  content      jsonb not null,
  model        text not null,
  lookup_count int not null default 1,
  created_at   timestamptz not null default now()
);

alter table public.explanation_cache enable row level security;

create policy "explanation_read" on public.explanation_cache
  for select to authenticated using (true);
