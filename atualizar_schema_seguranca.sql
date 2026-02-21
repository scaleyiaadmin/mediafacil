-- Migração de Segurança e Isolamento de Dados - Média Fácil (VERSÃO 100% FUNCIONAL V5)

-- 1. LIMPEZA TOTAL (Reset de RLS para garantir aplicação limpa)
ALTER TABLE public.orcamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento Orçamentos por Email" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Leitura de usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura Geral usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Escrita própria - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Edição Própria usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura de Entidade do Usuário" ON public.entidades;
DROP POLICY IF EXISTS "Acesso Público Leitura Entidades" ON public.entidades;

-- 2. POLÍTICA DE ENTIDADES (ESSENCIAL PARA O NOME APARECER)
-- Permitir que qualquer usuário autenticado leia a lista de prefeituras
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso Público Leitura Entidades" ON public.entidades
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. POLÍTICA DE ORÇAMENTOS (ISOLAMENTO POR VÍNCULO DE E-MAIL)
-- Não depende de IDs UUID, apenas do e-mail no seu token de acesso.
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento Orçamentos por Email" ON public.orcamentos
    FOR ALL USING (
        entidade_id IN (
            SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email'
        )
    )
    WITH CHECK (
        entidade_id IN (
            SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email'
        )
    );

-- 4. POLÍTICA DE USUÁRIOS (NECESSÁRIA PARA LOGIN E PERFIL)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Geral usuários" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Edição Própria usuários" ON public.usuarios FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- 5. POLÍTICA DE FORNECEDORES
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.fornecedores;
DROP POLICY IF EXISTS "Leitura Fornecedores Próprios ou Globais" ON public.fornecedores;
CREATE POLICY "Leitura Fornecedores Próprios ou Globais" ON public.fornecedores
    FOR SELECT USING (
        entidade_id IN (SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email')
        OR entidade_id IS NULL
    );

-- 6. SINCRONIZAÇÃO DE SEGURANÇA (Obrigatório rodar)
-- Garante que o e-mail no Auth seja o mesmo na tabela de usuários
UPDATE public.usuarios u
SET id = a.id
FROM auth.users a
WHERE u.email = a.email;

-- 7. POLÍTICA DE ITENS DO ORÇAMENTO (acesso via orçamento da entidade)
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamento_itens;
DROP POLICY IF EXISTS "Acesso Itens por Entidade" ON public.orcamento_itens;
CREATE POLICY "Acesso Itens por Entidade" ON public.orcamento_itens
    FOR ALL USING (
        orcamento_id IN (
            SELECT id FROM public.orcamentos
            WHERE entidade_id IN (
                SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email'
            )
        )
    )
    WITH CHECK (
        orcamento_id IN (
            SELECT id FROM public.orcamentos
            WHERE entidade_id IN (
                SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- 8. POLÍTICA DE FORNECEDORES DO ORÇAMENTO
ALTER TABLE public.orcamento_fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamento_fornecedores;
DROP POLICY IF EXISTS "Acesso Fornecedores do Orcamento" ON public.orcamento_fornecedores;
CREATE POLICY "Acesso Fornecedores do Orcamento" ON public.orcamento_fornecedores
    FOR ALL USING (
        orcamento_id IN (
            SELECT id FROM public.orcamentos
            WHERE entidade_id IN (
                SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email'
            )
        )
    )
    WITH CHECK (
        orcamento_id IN (
            SELECT id FROM public.orcamentos
            WHERE entidade_id IN (
                SELECT entidade_id FROM public.usuarios WHERE email = auth.jwt() ->> 'email'
            )
        )
    );
