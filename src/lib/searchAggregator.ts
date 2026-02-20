import { searchPNCPItems, PNCPItem } from './pncp';

interface SearchFilters {
    includePNCP: boolean;
    includeBPS: boolean;
    includeSINAPI: boolean;
}

/**
 * Palavras-chave para expansão semântica simples (IA Local/Heurística)
 * Isso ajuda a encontrar itens relacionados sem depender de uma API externa de NLP
 */
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
    // Se o usuário buscar "cadeira", também buscamos termos relacionados para garantir densidade
    let buscaTermos = [termoLower];
    for (const [chave, sinonimos] of Object.entries(dicionarioSinonimos)) {
        if (termoLower.includes(chave)) {
            buscaTermos = [...new Set([...buscaTermos, ...sinonimos])];
            break;
        }
    }

    // Executar buscas
    // Para simplificar e manter a performance, buscamos o termo principal no PNCP
    // O PNCP já é a fonte primária. BPS e SINAPI são subconjuntos ou bases que emulamos via filtro PNCP.
    const allResultsArrays = await Promise.all(buscaTermos.map(t => searchPNCPItems(t)));
    const allItems = allResultsArrays.flat();

    // Remover duplicatas por ID após expansão
    const uniqueItemsMap = new Map<string, PNCPItem>();
    allItems.forEach(item => uniqueItemsMap.set(item.id, item));
    const uniqueItems = Array.from(uniqueItemsMap.values());

    // Classificação Inteligente de Fontes (BPS/SINAPI Proxy)
    const classifiedItems = uniqueItems.map(item => {
        const textToAnalyze = (item.nome + " " + (item.orgao || "") + " " + (item.modalidade || "")).toLowerCase();

        // Heurística BPS (Saúde)
        const leadsHealth = [
            'saude', 'hospital', 'medicamento', 'upa', 'ubs', 'secretaria municipal de saude',
            'farmacia', 'medico', 'clinica', 'odontologico', 'vacina', 'unidade basica'
        ].some(k => textToAnalyze.includes(k));

        // Heurística SINAPI (Construção/Obras)
        const leadsConst = [
            'obra', 'engenharia', 'reforma', 'cimento', 'tijolo', 'concreto', 'pavimentação',
            'asfalto', 'infraestrutura', 'secretaria de obras', 'construção civil', 'predial'
        ].some(k => textToAnalyze.includes(k));

        let fonte = "PNCP";
        if (leadsHealth) fonte = "BPS (Est.)";
        else if (leadsConst) fonte = "SINAPI (Est.)";

        // Marcar se foi encontrado via expansão semântica
        const isExactMatch = item.nome.toLowerCase().includes(termoLower);
        const metadata = isExactMatch ? undefined : "Busca Inteligente";

        return { ...item, fonte, metadata };
    });

    // Filtro final baseado na seleção do usuário
    return classifiedItems.filter(item => {
        if (item.fonte === "PNCP" && filters.includePNCP) return true;
        if (item.fonte === "BPS (Est.)" && filters.includeBPS) return true;
        if (item.fonte === "SINAPI (Est.)" && filters.includeSINAPI) return true;
        return false;
    });
}

