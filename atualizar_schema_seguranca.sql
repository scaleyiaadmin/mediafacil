-- Migração de Segurança e Isolamento de Dados - Média Fácil (VERSÃO DEFINITIVA V3)

-- 1. SINCRONIZAÇÃO DE IDs (CORREÇÃO DE CHAVE ESTRANGEIRA)
-- Este passo garante que o ID na tabela pública seja o mesmo do Supabase Auth
DO $$
BEGIN
    -- Atualizar IDs na tabela usuarios para bater com auth.users usando o email como chave
    UPDATE public.usuarios u
    SET id = a.id
    FROM auth.users a
    WHERE u.email = a.email;
    
    RAISE NOTICE 'IDs de usuários sincronizados com Auth.';
END $$;

-- 2. Habilitar RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas
DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Leitura de usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Escrita própria - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura de Entidade do Usuário" ON public.entidades;

-- 4. Função Auxiliar para obter Entidade ID (Segurança Máxima)
CREATE OR REPLACE FUNCTION public.get_auth_entidade_id()
RETURNS uuid AS $$
  -- Busca o entidade_id do usuário logado baseado no ID da sessão (mais rápido e seguro)
  SELECT entidade_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Novas Políticas

-- ORÇAMENTOS: Isolamento total por entidade
CREATE POLICY "Isolamento por Entidade - Orçamentos" ON public.orcamentos
    FOR ALL
    USING (entidade_id = public.get_auth_entidade_id())
    WITH CHECK (entidade_id = public.get_auth_entidade_id());

-- FORNECEDORES: Próprios ou Globais
CREATE POLICY "Isolamento por Entidade - Fornecedores" ON public.fornecedores
    FOR ALL
    USING (entidade_id = public.get_auth_entidade_id() OR entidade_id IS NULL)
    WITH CHECK (entidade_id = public.get_auth_entidade_id());

-- USUÁRIOS: Leitura ampla para fluxo do sistema, mas edição apenas própria
CREATE POLICY "Leitura de usuários" ON public.usuarios
    FOR SELECT
    USING (true);

CREATE POLICY "Escrita própria - Usuários" ON public.usuarios
    FOR UPDATE
    USING (id = auth.uid());

-- ENTIDADES: Carregamento do Nome da Prefeitura
CREATE POLICY "Leitura de Entidade do Usuário" ON public.entidades
    FOR SELECT
    USING (id = public.get_auth_entidade_id());
