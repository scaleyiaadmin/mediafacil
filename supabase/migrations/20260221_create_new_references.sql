-- Migração para adicionar novas fontes de referência: SETOP, SIMPRO, SIGTAP e Banco de NFe

-- 1. SETOP (Infraestrutura/Obras MG)
CREATE TABLE IF NOT EXISTS public.referencia_setop (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    descricao TEXT NOT NULL,
    unidade TEXT,
    preco_base DECIMAL(12,2) DEFAULT 0,
    regiao TEXT,
    data_referencia DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SIMPRO (Saúde/Materiais e Medicamentos)
CREATE TABLE IF NOT EXISTS public.referencia_simpro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_simpro TEXT UNIQUE,
    descricao TEXT NOT NULL,
    fabricante TEXT,
    unidade TEXT,
    preco DECIMAL(12,2) DEFAULT 0,
    data_vigencia DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SIGTAP (Procedimentos SUS)
CREATE TABLE IF NOT EXISTS public.referencia_sigtap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    descricao TEXT NOT NULL,
    valor_sa DECIMAL(12,2) DEFAULT 0, -- Serviço Ambulatorial
    valor_sp DECIMAL(12,2) DEFAULT 0, -- Serviço Hospitalar
    valor_total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Banco de NFe (Notas Fiscais Eletrônicas / Preços Praticados)
CREATE TABLE IF NOT EXISTS public.referencia_nfe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave_acesso TEXT,
    item_nome TEXT NOT NULL,
    unidade TEXT,
    preco_unitario DECIMAL(12,2) NOT NULL,
    data_emissao DATE NOT NULL,
    orgao_nome TEXT,
    orgao_cnpj TEXT,
    municipio TEXT,
    uf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para busca rápida (ILike e TextSearch)
CREATE INDEX IF NOT EXISTS idx_setop_descricao ON public.referencia_setop USING gin (to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_simpro_descricao ON public.referencia_simpro USING gin (to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_sigtap_descricao ON public.referencia_sigtap USING gin (to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_nfe_item_nome ON public.referencia_nfe USING gin (to_tsvector('portuguese', item_nome));

-- Habilitar RLS (Segurança)
ALTER TABLE public.referencia_setop ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referencia_simpro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referencia_sigtap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referencia_nfe ENABLE ROW LEVEL SECURITY;

-- Permissões de leitura pública (conforme o padrão das outras tabelas de referência)
CREATE POLICY "Leitura pública SETOP" ON public.referencia_setop FOR SELECT USING (true);
CREATE POLICY "Leitura pública SIMPRO" ON public.referencia_simpro FOR SELECT USING (true);
CREATE POLICY "Leitura pública SIGTAP" ON public.referencia_sigtap FOR SELECT USING (true);
CREATE POLICY "Leitura pública NFe" ON public.referencia_nfe FOR SELECT USING (true);
