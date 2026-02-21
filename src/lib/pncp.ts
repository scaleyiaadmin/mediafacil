import { supabase } from './supabase';

export interface PNCPItem {
    id: string;
    nome: string;
    unidade: string;
    fonte: string;
    preco: number;
    data: string;
    orgao: string;
    modalidade?: string;
    cnpj?: string;
    cidadeUf?: string;
    metadata?: string;
}

/**
 * Busca itens localmente na tabela sincronizada do PNCP (Muito Rápido)
 */
export async function searchLocalPNCP(termo: string): Promise<PNCPItem[]> {
    if (!termo || termo.length < 3) return [];

    try {
        const { data, error } = await supabase
            .from('referencia_pncp')
            .select('*')
            .textSearch('item_nome', termo, {
                type: 'websearch',
                config: 'portuguese'
            })
            .limit(40);

        if (error || !data) {
            console.error("[PNCP Local] Erro na busca:", error);
            return [];
        }

        return data.map(item => ({
            id: `local-pncp-${item.id}`,
            nome: item.item_nome,
            unidade: item.unidade || 'un',
            fonte: 'PNCP (Local)',
            preco: parseFloat(item.valor_unitario) || 0,
            data: item.data_publicacao ? new Date(item.data_publicacao).toLocaleDateString('pt-BR') : "-",
            orgao: item.orgao_nome || "Órgão desconhecido",
            modalidade: item.modalidade || "Não informada",
            cnpj: item.orgao_cnpj,
            cidadeUf: item.municipio && item.uf ? `${item.municipio}/${item.uf}` : item.uf || "Brasil",
            metadata: "Base de Dados Local"
        }));
    } catch (err) {
        console.error("[PNCP Local] Erro inesperado:", err);
        return [];
    }
}

/**
 * Busca itens no PNCP seguindo uma estratégia híbrida:
 * 1. Busca primeiro no banco local (instantâneo).
 * 2. Se trouxer poucos resultados, busca na API do governo (lento mas atualizado).
 */
export async function searchPNCPItems(termo: string, fastMode = false): Promise<PNCPItem[]> {
    if (!termo || termo.length < 3) return [];

    try {
        console.log(`[PNCP] Iniciando busca híbrida para: "${termo}"`);

        // 1. Tentar busca local primeiro
        const localResults = await searchLocalPNCP(termo);

        // Se estivermos em modo rápido ou já temos resultados suficientes (3+), retornar apenas locais
        const threshold = 3;
        if (fastMode || localResults.length >= threshold) {
            console.log(`[PNCP] Busca finalizada (Modo: ${fastMode ? 'Turbo' : 'Threshold'}): ${localResults.length} itens.`);
            return localResults;
        }

        console.log(`[PNCP] Resultados locais insuficientes (${localResults.length}). Acionando API do Governo...`);

        // 2. Fallback para API (Busca em duas etapas)
        const apiResults = await searchPNCPItemsAPI(termo);

        // Unificar e remover duplicatas aproximadas (mesmo órgão e preço muito similar)
        const combined = [...localResults];

        apiResults.forEach(apiItem => {
            const isDuplicate = combined.some(localItem =>
                localItem.orgao === apiItem.orgao &&
                Math.abs(localItem.preco - apiItem.preco) < 0.01 &&
                localItem.nome.toLowerCase() === apiItem.nome.toLowerCase()
            );

            if (!isDuplicate) {
                combined.push(apiItem);
            }
        });

        return combined;
    } catch (error) {
        console.error("Erro geral PNCP:", error);
        return [];
    }
}

/**
 * Busca itens na API oficial do PNCP (Implementação original)
 */
async function searchPNCPItemsAPI(termo: string): Promise<PNCPItem[]> {
    try {
        const hoje = new Date();

        // A API do PNCP limita a busca a um intervalo de 1 ano (365 dias).
        // Vamos buscar os últimos 365 dias (1 ano) para maximizar resultados.
        const oneYearAgo = new Date();
        oneYearAgo.setDate(hoje.getDate() - 365);

        const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
        const dataInicial = formatDate(oneYearAgo);
        const dataFinal = formatDate(hoje);

        // Modalidades para buscar:
        // 6: Pregão (Eletrônico ou Presencial - Lei 10.520)
        // 13: Dispensa de Licitação (Lei 14.133/2021)
        // 8: Dispensa de Licitação (Lei 8.666/1993 - Legado)
        const modalidades = [6, 13, 8];

        const baseUrlConsulta = import.meta.env.DEV ? '/api/consulta' : 'https://pncp.gov.br/api/consulta';

        // Buscar contratos para TODAS as modalidades em paralelo
        const contractRequests = modalidades.map(async (mod) => {
            try {
                const searchUrl = `${baseUrlConsulta}/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=50&termo=${encodeURIComponent(termo)}&codigoModalidadeContratacao=${mod}`;
                const res = await fetch(searchUrl);

                if (!res.ok) {
                    console.warn(`[PNCP] Falha buscando contratos Mod ${mod}: ${res.status}`);
                    return [];
                }

                const json = await res.json();
                return json.data || [];
            } catch (e) {
                console.error(`[PNCP] Erro fetch mod ${mod}:`, e);
                return [];
            }
        });

        const contractsArrays = await Promise.all(contractRequests);
        const contratos = contractsArrays.flat(); // Junta todos os contratos encontrados

        // Remover duplicatas de contratos (pelo sequencialCompra + cnpj + ano)
        const uniqueContratos = Array.from(new Map(contratos.map(c => [`${c.orgaoEntidade?.cnpj}-${c.anoCompra}-${c.sequencialCompra}`, c])).values());

        console.log(`[PNCP] Total Contratos únicos encontrados: ${uniqueContratos.length}`);

        if (uniqueContratos.length === 0) return [];

        // LIMITAR para não inundar o browser de requisições
        // Vamos pegar os 15 primeiros contratos mais relevantes
        const topContratos = uniqueContratos.slice(0, 15);

        // 2. Buscar itens de cada contrato em paralelo (via Proxy /api/pncp)
        const baseUrlPncp = import.meta.env.DEV ? '/api/pncp' : 'https://pncp.gov.br/api/pncp';

        const itemRequests = topContratos.map(async (contrato: any) => {
            try {
                if (!contrato.orgaoEntidade || !contrato.anoCompra || !contrato.sequencialCompra) {
                    return [];
                }

                const { cnpj, razaoSocial } = contrato.orgaoEntidade;
                const ano = contrato.anoCompra;
                const seq = contrato.sequencialCompra;

                const uf = contrato.unidadeOrgao?.ufSigla || contrato.orgaoEntidade?.ufSigla || "";
                const municipio = contrato.unidadeOrgao?.municipioNome || "";
                const cidadeUf = municipio && uf ? `${municipio}/${uf}` : uf || "Brasil";

                const itemsUrl = `${baseUrlPncp}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens`;
                const resItems = await fetch(itemsUrl);

                if (!resItems.ok) return [];

                const itemsData = await resItems.json();

                const termoLower = termo.toLowerCase();

                return itemsData
                    .filter((item: any) => {
                        const desc = (item.descricao || item.materialOuServicoDescricao || "").toLowerCase();
                        return desc.includes(termoLower);
                    })
                    .map((item: any) => ({
                        id: `pncp-${item.id || Math.random()}`,
                        nome: (item.descricao || item.materialOuServicoDescricao || "Item sem nome").trim(),
                        unidade: item.unidadeMedida || "unid",
                        fonte: "PNCP",
                        preco: item.valorUnitarioHomologado || item.valorUnitarioEstimado || item.valorTotal || 0,
                        data: contrato.dataPublicacaoPncp ? new Date(contrato.dataPublicacaoPncp).toLocaleDateString('pt-BR') : "-",
                        orgao: razaoSocial || "Desconhecido",
                        modalidade: contrato.modalidadeNome || "Pregão",
                        cnpj: cnpj,
                        cidadeUf: cidadeUf
                    }));
            } catch (err) {
                console.warn(`[PNCP] Falha ao buscar itens do contrato ${contrato.sequencialCompra}`, err);
                return [];
            }
        });

        const resultsArrays = await Promise.all(itemRequests);
        const allItems = resultsArrays.flat();

        const filteredItems = allItems.filter(item => item.preco > 0);

        console.log(`[PNCP] Total de itens processados: ${filteredItems.length}`);
        return filteredItems;

    } catch (error) {
        console.error("Erro geral PNCP:", error);
        return [];
    }
}
