-- Create the orcamentos table if it doesn't exist (basic structure)
create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all columns exist in orcamentos (idempotent alterations)
do $$
begin
    -- Existing columns... (omitted for brevity in replacement chunk but I will include the full logic below)
    if not exists (select 1 from information_schema.columns where table_name = 'orcamentos' and column_name = 'nome') then
        alter table public.orcamentos add column nome text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'orcamentos' and column_name = 'data_solicitacao') then
        alter table public.orcamentos add column data_solicitacao timestamp with time zone default timezone('utc'::text, now()) not null;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'orcamentos' and column_name = 'data_finalizacao') then
        alter table public.orcamentos add column data_finalizacao timestamp with time zone;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'orcamentos' and column_name = 'status') then
        alter table public.orcamentos add column status text check (status in ('waiting_suppliers', 'completed', 'draft', 'deadline_expired')) default 'draft';
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'orcamentos' and column_name = 'links_enviados') then
        alter table public.orcamentos add column links_enviados integer default 0;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'orcamentos' and column_name = 'orcamentos_recebidos') then
        alter table public.orcamentos add column orcamentos_recebidos integer default 0;
    end if;

    -- FIX FOR USUARIOS TABLE: Create it if it doesn't exist
    if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'usuarios') then
        create table public.usuarios (
            id uuid primary key default gen_random_uuid(),
            nome text not null,
            email text unique not null,
            senha text,
            cargo text,
            setor text,
            is_admin boolean default false,
            tipo text default 'usuario',
            entidade_id uuid references public.entidades(id),
            status text default 'ativo',
            created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
    else
        -- Add missing columns to existing table
        if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuarios' and column_name = 'senha') then
            alter table public.usuarios add column senha text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuarios' and column_name = 'cargo') then
            alter table public.usuarios add column cargo text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuarios' and column_name = 'setor') then
            alter table public.usuarios add column setor text;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuarios' and column_name = 'is_admin') then
            alter table public.usuarios add column is_admin boolean default false;
        end if;
        if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuarios' and column_name = 'tipo') then
            alter table public.usuarios add column tipo text default 'usuario';
        end if;
        
        -- Special fix: Remove FK constraint if it exists (remains from previous templates)
        begin
            alter table public.usuarios drop constraint if exists usuarios_id_fkey;
        exception when others then null; end;
    end if;

    -- Ensure entidades has more fields
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'entidades' and column_name = 'cidade') then
        alter table public.entidades add column cidade text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'entidades' and column_name = 'uf') then
        alter table public.entidades add column uf text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'entidades' and column_name = 'cnpj') then
        alter table public.entidades add column cnpj text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'entidades' and column_name = 'tipo') then
        alter table public.entidades add column tipo text;
    end if;
end $$;

-- Ensure pgcrypto is enabled for UUID generation
create extension if not exists "pgcrypto";

-- Ensure we have at least one entity
do $$
begin
    if not exists (select 1 from public.entidades) then
      insert into public.entidades (nome, cidade, uf, cnpj, tipo) 
      values ('Prefeitura Municipal de Exemplo', 'Cidade Exemplo', 'SP', '12.345.678/0001-90', 'Prefeitura Municipal');
    end if;
end $$;

-- Insert a sample user if none exists (idempotent)
do $$
declare
  v_entidade_id uuid;
begin
  select id into v_entidade_id from public.entidades limit 1;
  
  -- Ensure table has default if missing (fix for existing bad table)
  begin
    alter table public.usuarios alter column id set default gen_random_uuid();
  exception when others then null; end;

  if not exists (select 1 from public.usuarios where email = 'admin@mediafacil.com.br') then
    begin
        -- Try to insert. If FK fails (because auth user doesn't exist), we ignore it.
        insert into public.usuarios (id, nome, email, senha, entidade_id, status)
        values (gen_random_uuid(), 'Administrador', 'admin@mediafacil.com.br', '123456', v_entidade_id, 'ativo');
    exception when foreign_key_violation then
        null; -- Ignore
    end;
  end if;
end $$;

-- Enable RLS for orcamentos
alter table public.orcamentos enable row level security;
drop policy if exists "Enable all access for all users" on public.orcamentos;
create policy "Enable all access for all users" on public.orcamentos
  for all using (true) with check (true);

-- Enable RLS for usuarios and add policy for password check
alter table public.usuarios enable row level security;
drop policy if exists "Enable read access for all users" on public.usuarios;
create policy "Enable read access for all users" on public.usuarios
  for select using (true);
drop policy if exists "Enable insert for all users" on public.usuarios;
create policy "Enable insert for all users" on public.usuarios
  for insert with check (true);
drop policy if exists "Enable update for all users" on public.usuarios;
create policy "Enable update for all users" on public.usuarios
  for update using (true);
drop policy if exists "Enable delete for all users" on public.usuarios;
create policy "Enable delete for all users" on public.usuarios
  for delete using (true);


-- Insert some sample data (only if table is empty and we have an entity AND a user)
-- We attempt to grab the first available entity ID and User ID.
-- If 'entidades' or 'auth.users' is empty, nothing will be inserted, preventing errors.

do $$
declare
  v_entidade_id uuid;
  v_usuario_id uuid;
begin
  -- Try to find an entity
  select id into v_entidade_id from public.entidades limit 1;
  
  -- Try to find a user (checking auth.users first, then maybe public.usuarios if needed)
  select id into v_usuario_id from auth.users limit 1;
  
  -- If we have both, we can insert
  if v_entidade_id is not null and v_usuario_id is not null then
  
    if not exists (select 1 from public.orcamentos where nome = 'Material de escritório - Secretaria de Educação') then
      insert into public.orcamentos (nome, data_solicitacao, status, links_enviados, orcamentos_recebidos, entidade_id, usuario_id)
      values ('Material de escritório - Secretaria de Educação', now(), 'completed', 8, 5, v_entidade_id, v_usuario_id);
    end if;

    if not exists (select 1 from public.orcamentos where nome = 'Equipamentos de informática - TI') then
      insert into public.orcamentos (nome, data_solicitacao, status, links_enviados, orcamentos_recebidos, entidade_id, usuario_id)
      values ('Equipamentos de informática - TI', now(), 'waiting_suppliers', 12, 3, v_entidade_id, v_usuario_id);
    end if;

    if not exists (select 1 from public.orcamentos where nome = 'Mobiliário escolar - Escola Municipal') then
      insert into public.orcamentos (nome, data_solicitacao, status, links_enviados, orcamentos_recebidos, entidade_id, usuario_id)
      values ('Mobiliário escolar - Escola Municipal', now(), 'draft', 0, 0, v_entidade_id, v_usuario_id);
    end if;
    
  end if;
end $$;





-- Tabela de Fornecedores
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  cnpj text unique not null,
  razao_social text not null,
  nome_fantasia text,
  cidade text,
  uf text,
  regiao text,
  email text,
  telefone text,
  segmentos text[], -- Array de strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure fornecedores columns exist (migration fix)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'fornecedores' and column_name = 'segmentos') then
        alter table public.fornecedores add column segmentos text[];
    end if;
     if not exists (select 1 from information_schema.columns where table_name = 'fornecedores' and column_name = 'regiao') then
        alter table public.fornecedores add column regiao text;
    end if;
end $$;

-- Tabela de Itens do Orçamento
create table if not exists public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid references public.orcamentos(id) on delete cascade not null,
  nome text not null,
  descricao text,
  unidade text,
  quantidade numeric not null,
  valor_referencia numeric, -- Média ou Mediana calculada
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure valor_referencia exists (migration fix)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'orcamento_itens' and column_name = 'valor_referencia') then
        alter table public.orcamento_itens add column valor_referencia numeric;
    end if;
end $$;

-- Tabela de Relacionamento Orçamento <-> Fornecedores
create table if not exists public.orcamento_fornecedores (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid references public.orcamentos(id) on delete cascade not null,
  fornecedor_id uuid references public.fornecedores(id) on delete cascade not null,
  token text unique default encode(gen_random_bytes(16), 'hex'),
  status text default 'pending' check (status in ('pending', 'replied', 'declined')),
  data_resposta timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(orcamento_id, fornecedor_id)
);

-- Tabela de Respostas de Itens (Valores enviados pelo fornecedor)
create table if not exists public.respostas_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_fornecedor_id uuid references public.orcamento_fornecedores(id) on delete cascade not null,
  orcamento_item_id uuid references public.orcamento_itens(id) on delete cascade not null,
  marca text,
  valor_unitario numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Notificações
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid, -- Nulo para notificações globais ou se usuário_id for da auth.users
  entidade_id uuid references public.entidades(id),
  titulo text not null,
  mensagem text not null,
  lida boolean default false,
  link text, -- Para onde navegar ao clicar
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.fornecedores enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.orcamento_fornecedores enable row level security;

-- Policies (Simplificadas para desenvolvimento)
create policy "Enable all access for all users" on public.fornecedores for all using (true) with check (true);
create policy "Enable all access for all users" on public.orcamento_itens for all using (true) with check (true);
create policy "Enable all access for all users" on public.orcamento_fornecedores for all using (true) with check (true);
create policy "Enable all access for all users" on public.respostas_itens for all using (true) with check (true);
create policy "Enable all access for all users" on public.notificacoes for all using (true) with check (true);

-- Seed Fornecedores (Se vazio)
do $$
begin
  if not exists (select 1 from public.fornecedores) then
    insert into public.fornecedores (cnpj, razao_social, cidade, uf, regiao, email, telefone, segmentos)
    values 
    ('12.345.678/0001-90', 'Papelaria Central Ltda', 'São Paulo', 'SP', 'Grande São Paulo', 'contato@papelariacentral.com.br', '(11) 3456-7890', ARRAY['Material de Escritório']),
    ('98.765.432/0001-10', 'TechSupply Informática', 'Campinas', 'SP', 'Campinas', 'vendas@techsupply.com.br', '(19) 3333-4444', ARRAY['Equipamentos de Informática', 'Serviços de TI']),
    ('11.222.333/0001-44', 'Móveis Escolares Brasil', 'Belo Horizonte', 'MG', 'Grande BH', 'comercial@moveisbrasil.com.br', '(31) 2222-1111', ARRAY['Mobiliário']),
    ('55.666.777/0001-88', 'Distribuidora Limpeza Total', 'Rio de Janeiro', 'RJ', 'Metropolitana do Rio', 'pedidos@limpezatotal.com.br', '(21) 5555-6666', ARRAY['Material de Limpeza', 'EPIs']),
    ('33.444.555/0001-22', 'Farmácia Atacado Saúde', 'Curitiba', 'PR', 'Metropolitana de Curitiba', 'atacado@farmaciadistribuidora.com.br', '(41) 7777-8888', ARRAY['Medicamentos']);
  end if;
end $$;
-- Tabela de Setores/Secretarias
create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  entidade_id uuid references public.entidades(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for setores
alter table public.setores enable row level security;
create policy "Enable all access for all users" on public.setores for all using (true) with check (true);

-- Seed Setores (Se vazio)
do $$
declare
  v_entidade_id uuid;
begin
  select id into v_entidade_id from public.entidades limit 1;
  
  if v_entidade_id is not null and not exists (select 1 from public.setores) then
    insert into public.setores (nome, entidade_id)
    values 
    ('Secretaria de Administração', v_entidade_id),
    ('Secretaria de Educação', v_entidade_id),
    ('Secretaria de Saúde', v_entidade_id),
    ('Secretaria de Finanças', v_entidade_id),
    ('Secretaria de Obras', v_entidade_id),
    ('Departamento de TI', v_entidade_id),
    ('Gabinete do Prefeito', v_entidade_id),
    ('Setor de Compras/Licitação', v_entidade_id);
  end if;
end $$;
