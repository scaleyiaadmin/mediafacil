-- Migração de Segurança e Isolamento de Dados - Média Fácil (VERSÃO FINAL ROBUSTA)

-- 1. Habilitar RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas
DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Leitura de usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Escrita própria - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura de Entidade do Usuário" ON public.entidades;

-- 3. Função Auxiliar para obter Entidade ID (Evita repetição e melhora performance)
CREATE OR REPLACE FUNCTION public.get_auth_entidade_id()
RETURNS uuid AS $$
  SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Novas Políticas

-- ORÇAMENTOS: Filtro direto por e-mail (Segurança Máxima)
CREATE POLICY "Isolamento por Entidade - Orçamentos" ON public.orcamentos
    FOR ALL
    USING (entidade_id = public.get_auth_entidade_id())
    WITH CHECK (entidade_id = public.get_auth_entidade_id());

-- FORNECEDORES: Mesma lógica + Fornecedores Globais (entidade_id null)
CREATE POLICY "Isolamento por Entidade - Fornecedores" ON public.fornecedores
    FOR ALL
    USING (entidade_id = public.get_auth_entidade_id() OR entidade_id IS NULL)
    WITH CHECK (entidade_id = public.get_auth_entidade_id());

-- USUÁRIOS: Geral pode ler todos (necessário para o sistema funcionar), mas só edita o próprio
CREATE POLICY "Leitura de usuários" ON public.usuarios
    FOR SELECT
    USING (true);

CREATE POLICY "Escrita própria - Usuários" ON public.usuarios
    FOR UPDATE
    USING (email = auth.jwt() ->> 'email');

-- ENTIDADES: Só lê a prefeitura vinculada ao seu usuário
CREATE POLICY "Leitura de Entidade do Usuário" ON public.entidades
    FOR SELECT
    USING (id = public.get_auth_entidade_id());

-- 5. Garantir que o usuário admin tenha entidade vinculada (Exemplo para correção)
-- UPDATE public.usuarios SET entidade_id = (SELECT id FROM public.entidades LIMIT 1) WHERE email = 'admin@mediafacil.com.br';
