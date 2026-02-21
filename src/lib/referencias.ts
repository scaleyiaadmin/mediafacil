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

    if ((sources as any).setop) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_setop')
                    .select('*')
                    .ilike('descricao', `%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `setop-${item.id}`,
                            nome: item.descricao,
                            unidade: item.unidade || 'UN',
                            fonte: 'SETOP',
                            preco: item.preco_base || 0,
                            data: item.data_referencia || '2025',
                            orgao: `SINFRA/DER-MG (Cod: ${item.codigo})`,
                            metadata: `Região: ${item.regiao || 'Geral'}`
                        });
                    });
                }
            })()
        );
    }

    if ((sources as any).simpro) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_simpro')
                    .select('*')
                    .ilike('descricao', `%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `simpro-${item.id}`,
                            nome: item.descricao,
                            unidade: item.unidade || 'UN',
                            fonte: 'SIMPRO',
                            preco: item.preco || 0,
                            data: item.data_vigencia || '2025',
                            orgao: `Hospitalar (${item.fabricante || 'Geral'})`,
                            metadata: `Cod SIMPRO: ${item.codigo_simpro}`
                        });
                    });
                }
            })()
        );
    }

    if ((sources as any).sigtap) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_sigtap')
                    .select('*')
                    .ilike('descricao', `%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `sigtap-${item.id}`,
                            nome: item.descricao,
                            unidade: 'PROC',
                            fonte: 'SIGTAP',
                            preco: item.valor_total || 0,
                            data: '2025',
                            orgao: `SUS (Cod: ${item.codigo})`,
                            metadata: `SA: R$ ${item.valor_sa} / SP: R$ ${item.valor_sp}`
                        });
                    });
                }
            })()
        );
    }

    if ((sources as any).nfe) {
        searchPromises.push(
            (async () => {
                const { data } = await supabase.from('referencia_nfe')
                    .select('*')
                    .ilike('item_nome', `%${termo}%`)
                    .limit(20);

                if (data) {
                    data.forEach(item => {
                        results.push({
                            id: `nfe-${item.id}`,
                            nome: item.item_nome,
                            unidade: item.unidade || 'UN',
                            fonte: 'Banco NFe',
                            preco: item.preco_unitario || 0,
                            data: item.data_emissao ? new Date(item.data_emissao).toLocaleDateString('pt-BR') : '-',
                            orgao: item.orgao_nome || 'Órgão Particular',
                            metadata: `Chave: ${item.chave_acesso?.substring(0, 20)}...`,
                            cnpj: item.orgao_cnpj,
                            cidadeUf: item.uf ? `${item.municipio || ''}/${item.uf}` : undefined
                        });
                    });
                }
            })()
        );
    }

    await Promise.all(searchPromises);
    return results;
}
