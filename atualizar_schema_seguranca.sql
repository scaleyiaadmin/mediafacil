-- ============================================================
-- RESET COMPLETO DE SEGURANÇA - Média Fácil
-- Remove TODAS as políticas e desativa RLS em todas as tabelas
-- ============================================================

-- ORCAMENTOS
ALTER TABLE public.orcamentos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por Entidade - Orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Isolamento Orçamentos por Email" ON public.orcamentos;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamentos;

-- ENTIDADES
ALTER TABLE public.entidades DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de Entidade do Usuário" ON public.entidades;
DROP POLICY IF EXISTS "Acesso Público Leitura Entidades" ON public.entidades;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.entidades;

-- USUARIOS
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Leitura Geral usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Escrita própria - Usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Edição Própria usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.usuarios;

-- FORNECEDORES
ALTER TABLE public.fornecedores DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura Fornecedores Próprios ou Globais" ON public.fornecedores;
DROP POLICY IF EXISTS "Isolamento por Entidade - Fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.fornecedores;

-- ORCAMENTO_ITENS
ALTER TABLE public.orcamento_itens DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Itens por Entidade" ON public.orcamento_itens;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamento_itens;

-- ORCAMENTO_FORNECEDORES
ALTER TABLE public.orcamento_fornecedores DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Fornecedores do Orcamento" ON public.orcamento_fornecedores;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orcamento_fornecedores;
