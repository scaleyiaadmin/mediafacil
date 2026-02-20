import { searchPNCPItems, PNCPItem } from './pncp';
import { searchReferences } from './referencias';

export interface SearchFilters {
    includePNCP: boolean;
    includeBPS: boolean; // Agora CMED
    includeSINAPI: boolean;
    includeCATSER?: boolean;
}

const dicionarioSinonimos: Record<string, string[]> = {
    "cadeira": ["poltrona", "assento", "longarina"],
    "paracetamol": ["acetaminofeno", "analgésico", "antitérmico"],
    "carro": ["veículo", "automóvel", "picape", "van"],
    "reforma": ["obra", "manutenção", "construção", "pintura"],
    "computador": ["notebook", "laptop", "desktop", "estação de trabalho"],
    "papel": ["sulfite", "a4", "resma"],
    "limpeza": ["detergente", "desinfetante", "sabão", "higiene"]
};

export async function searchAllSources(termo: string, filters: SearchFilters): Promise<PNCPItem[]> {
    if (!termo || termo.length < 3) return [];

    const termoLower = termo.toLowerCase();

    // Expansão Semântica Inteligente
    let buscaTermos = [termoLower];
    for (const [chave, sinonimos] of Object.entries(dicionarioSinonimos)) {
        if (termoLower.includes(chave)) {
            buscaTermos = [...new Set([...buscaTermos, ...sinonimos])];
            break;
        }
    }

    // Preparar promessas de busca
    const searchPromises: Promise<PNCPItem[]>[] = [];

    // 1. PNCP (Sempre busca se selecionado)
    if (filters.includePNCP) {
        searchPromises.push(...buscaTermos.map(t => searchPNCPItems(t)));
    }

    // 2. Referências Reais (Supabase)
    const refSources = {
        catser: !!filters.includeCATSER,
        sinapi: filters.includeSINAPI,
        cmed: filters.includeBPS
    };

    if (refSources.catser || refSources.sinapi || refSources.cmed) {
        searchPromises.push(searchReferences(termo, refSources));
    }

    // Executar todas as buscas em paralelo
    const allResultsArrays = await Promise.all(searchPromises);
    const allItems = allResultsArrays.flat();

    // Remover duplicatas por ID
    const uniqueItemsMap = new Map<string, PNCPItem>();
    allItems.forEach(item => uniqueItemsMap.set(item.id, item));
    const uniqueItems = Array.from(uniqueItemsMap.values());

    // Marcar metadata para busca inteligente
    return uniqueItems.map(item => {
        const isExactMatch = item.nome.toLowerCase().includes(termoLower);
        const metadata = isExactMatch ? item.metadata : (item.metadata ? `${item.metadata} • Busca Inteligente` : "Busca Inteligente");

        return { ...item, metadata };
    });
}

