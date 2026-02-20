import { supabase } from './supabase';
import { PNCPItem } from './pncp';

export async function searchReferences(termo: string, sources: { catser: boolean; sinapi: boolean; cmed: boolean }): Promise<PNCPItem[]> {
    if (!termo || termo.length < 3) return [];

    const results: PNCPItem[] = [];
    const searchPromises: Promise<void>[] = [];

    if (sources.catser) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_catser')
                    .select('*')
                    .ilike('descricao', `%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `catser-${item.id}`,
                            nome: item.descricao,
                            unidade: 'UN',
                            fonte: 'CATSER',
                            preco: 0, // CATSER não tem preço fixo por item na planilha base
                            data: 'Referência',
                            orgao: `Catálogo de Serviços (Cod: ${item.codigo})`,
                            metadata: `${item.grupo} / ${item.classe}`
                        });
                    });
                }
            })()
        );
    }

    if (sources.sinapi) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_sinapi')
                    .select('*')
                    .ilike('descricao', `%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `sinapi-${item.id}`,
                            nome: item.descricao,
                            unidade: item.unidade || 'UN',
                            fonte: 'SINAPI',
                            preco: item.preco_base || 0,
                            data: 'Dez/2025',
                            orgao: `SINAPI (Cod: ${item.codigo})`,
                            metadata: 'Preço de Referência'
                        });
                    });
                }
            })()
        );
    }

    if (sources.cmed) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_cmed')
                    .select('*')
                    .or(`produto.ilike.%${termo}%,substancia.ilike.%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `cmed-${item.id}`,
                            nome: `${item.produto} - ${item.substancia}`,
                            unidade: 'UN',
                            fonte: 'CMED',
                            preco: item.pmvg || item.pf || 0,
                            data: '2025',
                            orgao: `Medicamentos (EAN: ${item.ean})`,
                            metadata: `PF: R$ ${item.pf} / PMVG: R$ ${item.pmvg}`
                        });
                    });
                }
            })()
        );
    }

    await Promise.all(searchPromises);
    return results;
}
