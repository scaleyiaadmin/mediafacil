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
 * Busca itens no PNCP em duas etapas (Contratos/Licitações -> Itens).
 * 1. Busca licitações/contratos que contenham o termo.
 * 2. Busca os itens de cada um desses contratos em paralelo.
 */
export async function searchPNCPItems(termo: string): Promise<PNCPItem[]> {
    if (!termo || termo.length < 3) return [];

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
