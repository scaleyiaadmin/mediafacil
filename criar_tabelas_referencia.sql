-- Migração: Tabelas de Referência para Média Fácil
-- Execute este script no SQL Editor do seu painel Supabase.

-- 1. Tabela CATSER
create table if not exists public.referencia_catser (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  descricao text not null,
  grupo text,
  classe text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS e permissões para CATSER
alter table public.referencia_catser enable row level security;
drop policy if exists "Enable all access for all users" on public.referencia_catser;
create policy "Enable all access for all users" on public.referencia_catser
  for all using (true) with check (true);

-- 2. Tabela SINAPI
create table if not exists public.referencia_sinapi (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  descricao text not null,
  unidade text,
  preco_base numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS e permissões para SINAPI
alter table public.referencia_sinapi enable row level security;
drop policy if exists "Enable all access for all users" on public.referencia_sinapi;
create policy "Enable all access for all users" on public.referencia_sinapi
  for all using (true) with check (true);

-- 3. Tabela CMED
create table if not exists public.referencia_cmed (
  id uuid primary key default gen_random_uuid(),
  ean text,
  produto text not null,
  substancia text,
  apresentacao text,
  pf numeric,
  pmvg numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS e permissões para CMED
alter table public.referencia_cmed enable row level security;
drop policy if exists "Enable all access for all users" on public.referencia_cmed;
create policy "Enable all access for all users" on public.referencia_cmed
  for all using (true) with check (true);
