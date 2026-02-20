import { searchPNCPItems, PNCPItem } from './pncp';

/**
 * SINAPI Proxy Search
 * Searches PNCP but filters/tags for Construction/Engineering related items.
 */
export async function searchSINAPI(termo: string): Promise<PNCPItem[]> {
    const items = await searchPNCPItems(termo);

    const constrKeywords = ['obra', 'engenharia', 'reforma', 'construção', 'pavimentação', 'cimento', 'tijolo', 'pedreiro', 'elétrica', 'hidráulica'];

    return items.map(item => {
        const textToCheck = (item.orgao + " " + item.nome + " " + item.modalidade).toLowerCase();
        const isConst = constrKeywords.some(kw => textToCheck.includes(kw));

        if (isConst) {
            return { ...item, fonte: "SINAPI (Est.)" };
        }
        return item;
    }).filter(item => item.fonte === "SINAPI (Est.)");
}
