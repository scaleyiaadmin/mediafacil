-- Migração de Segurança e Isolamento de Dados - Média Fácil (VERSÃO RESILIENTE V4)

-- 1. SINCRONIZAÇÃO DE IDs (Tentar novamente para garantir)
UPDATE public.usuarios u
SET id = a.id
FROM auth.users a
WHERE u.email = a.email;

-- 2. Habilitar RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

-- 3. Função Auxiliar ULTRA RESILIENTE
-- Esta função é o coração da segurança. Ela agora checa por ID e por E-MAIL.
CREATE OR REPLACE FUNCTION public.get_auth_entidade_id()
RETURNS uuid AS $$
DECLARE
    v_entidade_id uuid;
BEGIN
    -- 1. Tentar pelo ID (mais performático)
    SELECT entidade_id INTO v_entidade_id FROM public.usuarios WHERE id = auth.uid();
    
    -- 2. Se não achou por ID, tenta buscar pelo E-MAIL do token JWT
    IF v_entidade_id IS NULL THEN
        SELECT entidade_id INTO v_entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email';
    END IF;
    
    RETURN v_entidade_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Limpar e Recriar Políticas
DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Leitura de usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Escrita própria - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura de Entidade do Usuário" ON public.entidades;

-- POLÍTICAS
CREATE POLICY "Isolamento por Entidade - Orçamentos" ON public.orcamentos
    FOR ALL USING (entidade_id = public.get_auth_entidade_id())
    WITH CHECK (entidade_id = public.get_auth_entidade_id());

CREATE POLICY "Isolamento por Entidade - Fornecedores" ON public.fornecedores
    FOR ALL USING (entidade_id = public.get_auth_entidade_id() OR entidade_id IS NULL)
    WITH CHECK (entidade_id = public.get_auth_entidade_id());

CREATE POLICY "Leitura de usuários" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Escrita própria - Usuários" ON public.usuarios FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- ENTIDADES: Se get_auth_entidade_id falhar em retornar algo, o usuário não verá nada.
-- Vamos garantir que ele ao menos consiga ler a própria entidade se o ID bater com o que ele tem no perfil.
CREATE POLICY "Leitura de Entidade do Usuário" ON public.entidades
    FOR SELECT USING (
        id = public.get_auth_entidade_id()
        OR id IN (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
    );
