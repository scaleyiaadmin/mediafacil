-- Migração de Segurança e Isolamento de Dados - Média Fácil (VERSÃO CORRIGIDA)
-- Execute este script no SQL Editor do seu painel Supabase.

-- 1. Melhorar a tabela de Fornecedores para suportar isolamento por Entidade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fornecedores' AND column_name = 'entidade_id') THEN
        ALTER TABLE public.fornecedores ADD COLUMN entidade_id uuid REFERENCES public.entidades(id);
    END IF;
END $$;

-- 2. Habilitar RLS em todas as tabelas críticas
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas (para evitar conflitos e recursão)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamentos;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.fornecedores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;
DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Isolamento por Entidade - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura pública de usuários" ON public.usuarios;

-- 4. Criar novas políticas de isolamento OTIMIZADAS (usando metadados do JWT para evitar recursão)

-- Políticas para ORÇAMENTOS: Apenas usuários da mesma entidade podem ver/editar
-- Usamos o metadado 'entidade_id' do JWT que é injetado pelo Supabase após o login
CREATE POLICY "Isolamento por Entidade - Orçamentos" ON public.orcamentos
    FOR ALL
    USING (entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid)
    WITH CHECK (entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid);

-- Políticas para FORNECEDORES: Usuários veem fornecedores da sua entidade OU os globais (entidade_id nulo)
CREATE POLICY "Isolamento por Entidade - Fornecedores" ON public.fornecedores
    FOR ALL
    USING (
        entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid
        OR entidade_id IS NULL 
    )
    WITH CHECK (entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid);

-- Políticas para USUÁRIOS: 
-- 1. Permitir leitura pública para que o fluxo de login funcione (necessário para validar senha customizada)
CREATE POLICY "Permitir leitura para login" ON public.usuarios
    FOR SELECT
    USING (true);

-- 2. Garantir isolamento para operações de escrita (se necessário no futuro)
CREATE POLICY "Isolamento por Entidade - Usuários" ON public.usuarios
    FOR UPDATE
    USING (email = auth.jwt() ->> 'email');

-- 5. Política para ENTIDADES: Permitir que usuários vejam apenas sua própria entidade
CREATE POLICY "Isolamento por Entidade - Entidades" ON public.entidades
    FOR SELECT
    USING (id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid);
