-- Tabela para armazenar todas as referências de preços do PNCP
CREATE TABLE IF NOT EXISTS public.referencia_pncp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_nome TEXT NOT NULL,
    item_descricao TEXT,
    unidade TEXT,
    quantidade NUMERIC,
    valor_unitario NUMERIC,
    valor_total NUMERIC,
    data_publicacao DATE,
    orgao_nome TEXT,
    orgao_cnpj TEXT,
    municipio TEXT,
    uf TEXT,
    modalidade TEXT,
    sequencial_compra TEXT,
    ano_compra INTEGER,
    link_pncp TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca ultrarrápida (Essencial para o Média Fácil)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_referencia_pncp_item_nome_trgm ON public.referencia_pncp USING gin (item_nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_referencia_pncp_data ON public.referencia_pncp (data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_referencia_pncp_uf ON public.referencia_pncp (uf);
