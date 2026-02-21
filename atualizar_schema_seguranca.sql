-- Migração de Segurança e Isolamento de Dados - Média Fácil (VERSÃO CORRIGIDA V2)
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

-- 3. Limpar políticas antigas
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamentos;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.fornecedores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;
DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Isolamento por Entidade - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Isolamento por Entidade - Entidades" ON public.entidades;
DROP POLICY IF EXISTS "Permitir leitura para login" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir leitura para login" ON public.entidades;

-- 4. Criar novas políticas de isolamento OTIMIZADAS

-- Políticas para ORÇAMENTOS: Apenas usuários da mesma entidade podem ver/editar
CREATE POLICY "Isolamento por Entidade - Orçamentos" ON public.orcamentos
    FOR ALL
    USING (
        entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid
        OR entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
    )
    WITH CHECK (
        entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid
        OR entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
    );

-- Políticas para FORNECEDORES: Usuários veem fornecedores da sua entidade OU os globais
CREATE POLICY "Isolamento por Entidade - Fornecedores" ON public.fornecedores
    FOR ALL
    USING (
        entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid
        OR entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
        OR entidade_id IS NULL 
    )
    WITH CHECK (
        entidade_id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid
        OR entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
    );

-- Políticas para USUÁRIOS: 
-- Permitir leitura de usuários para que o fluxo de login e carregamento de perfil funcione
CREATE POLICY "Leitura de usuários" ON public.usuarios
    FOR SELECT
    USING (true);

CREATE POLICY "Escrita própria - Usuários" ON public.usuarios
    FOR UPDATE
    USING (email = auth.jwt() ->> 'email');

-- Políticas para ENTIDADES: 
-- Permitir leitura da entidade vinculada ao usuário por e-mail (mais robusto que metadados)
CREATE POLICY "Leitura de Entidade do Usuário" ON public.entidades
    FOR SELECT
    USING (
        id = (auth.jwt() -> 'user_metadata' ->> 'entidade_id')::uuid
        OR id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
    );
