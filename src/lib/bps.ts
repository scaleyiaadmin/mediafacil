import { searchPNCPItems, PNCPItem } from './pncp';

/**
 * BPS Proxy Search
 * Searches PNCP but filters/tags for Health related items.
 */
export async function searchBPS(termo: string): Promise<PNCPItem[]> {
    // Add health context to term if it's too generic, 
    // but usually user searches "Dipirona" works fine.
    // We mainly want to tag the source.

    // Potential improvement: Append " hospitalar" or " medicamento" to search term?
    // For now, let's keep the user term but maybe search specifically in health modalities if possible (not easy via PNCP API).

    const items = await searchPNCPItems(termo);

    // Filter logic: Check if item or organ sounds like "Health"
    // This is a heuristic.
    const healthKeywords = ['saude', 'hospital', 'clinica', 'medicamento', 'farmacia', 'ubs', 'upa', 'saúde', 'médico', 'enfermagem'];

    return items.map(item => {
        // Simple heuristic score
        const textToCheck = (item.orgao + " " + item.nome + " " + item.modalidade).toLowerCase();
        const isHealth = healthKeywords.some(kw => textToCheck.includes(kw));

        if (isHealth) {
            return { ...item, fonte: "BPS (Est.)" };
        }
        return item; // Keep as PNCP if not "Health" enough? Or maybe return only health?
        // Strategy: Return ALL but tag health ones as BPS. 
        // OR: Only return health ones? 
        // Goal: "Simulate" BPS. So we should probably filter.
    }).filter(item => item.fonte === "BPS (Est.)");
}
