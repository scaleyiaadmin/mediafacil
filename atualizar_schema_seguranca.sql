-- Migração de Segurança e Isolamento de Dados - Média Fácil
-- Execute este script no SQL Editor do seu painel Supabase.

-- 1. Melhorar a tabela de Fornecedores para suportar isolamento por Entidade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fornecedores' AND column_name = 'entidade_id') THEN
        ALTER TABLE public.fornecedores ADD COLUMN entidade_id uuid REFERENCES public.entidades(id);
    END IF;
END $$;

-- 2. Habilitar RLS em todas as tabelas críticas (se ainda não estiver)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas (perigosas/largas)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamentos;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.fornecedores;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;

-- 4. Criar novas políticas de isolamento por Entidade (Entidade_id)

-- Políticas para ORÇAMENTOS: Apenas usuários da mesma entidade podem ver/editar
CREATE POLICY "Isolamento por Entidade - Orçamentos" ON public.orcamentos
    FOR ALL
    USING (entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt()->>'email'))
    WITH CHECK (entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt()->>'email'));

-- Políticas para FORNECEDORES: Usuários veem fornecedores da sua entidade OU os globais (entidade_id nulo)
CREATE POLICY "Isolamento por Entidade - Fornecedores" ON public.fornecedores
    FOR ALL
    USING (
        entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt()->>'email')
        OR entidade_id IS NULL -- Fornecedores globais do sistema
    )
    WITH CHECK (entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt()->>'email'));

-- Políticas para USUÁRIOS: Ver apenas usuários da própria entidade
CREATE POLICY "Isolamento por Entidade - Usuários" ON public.usuarios
    FOR SELECT
    USING (entidade_id = (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt()->>'email'));

-- 5. Garantir que novos orçamentos tenham o usuario_id e entidade_id corretos
-- (Já tratado no frontend, mas RLS garante a validação)
