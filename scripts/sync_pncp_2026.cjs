const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env manualmente para evitar dependências extras
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Erro: Variáveis de ambiente do Supabase não encontradas.");
    process.exit(1);
}

async function syncPNCP2026() {
    console.log("🚀 Iniciando Sincronização PNCP 2026...");

    // Intervalo de busca: Todo o ano de 2026 até hoje (ou fim do ano)
    const dataInicial = "20260101";
    const hoje = new Date();
    const dataFinal = hoje.toISOString().split('T')[0].replace(/-/g, '');

    const consultaUrl = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&tamanhoPagina=50`;
    const modalidades = [6, 13, 8, 10, 14, 15]; // Principais modalidades de contratação

    let totalSincronizado = 0;
    const MAX_ITENS = 100000;

    try {
        for (const mod of modalidades) {
            if (totalSincronizado >= MAX_ITENS) break;
            let pagina = 1;
            console.log(`\n=== 🔎 Consultando Modalidade: ${mod} ===`);

            while (true) {
                if (totalSincronizado >= MAX_ITENS) break;
                console.log(`  📄 Página ${pagina}...`);
                const res = await fetch(`${consultaUrl}&pagina=${pagina}&codigoModalidadeContratacao=${mod}`);
                if (!res.ok) {
                    console.error(`    ❌ Erro na API do PNCP: ${res.status}`);
                    break;
                }

                const json = await res.json();
                const contratos = json.data || [];
                if (contratos.length === 0) {
                    console.log(`    ℹ️ Nenhum contrato encontrado para esta modalidade.`);
                    break;
                }

                for (const contrato of contratos) {
                    if (totalSincronizado >= MAX_ITENS) {
                        console.log(`\n🛑 Limite de ${MAX_ITENS} itens atingido. Encerrando.`);
                        break;
                    }

                    const cnpj = contrato.orgaoEntidade.cnpj;
                    const ano = contrato.anoCompra;
                    const seq = contrato.sequencialCompra;
                    const orgaoNome = contrato.orgaoEntidade.razaoSocial;
                    const dataPublicacao = contrato.dataPublicacaoPncp;
                    const modalidade = contrato.modalidadeNome;
                    const uf = contrato.unidadeOrgao?.ufSigla || contrato.orgaoEntidade?.ufSigla || "";
                    const municipio = contrato.unidadeOrgao?.municipioNome || "";

                    console.log(`    📦 Buscando itens: [${seq}] - ${orgaoNome.substring(0, 40)}...`);

                    // Buscar itens do contrato
                    const itemsUrl = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens`;
                    const resItems = await fetch(itemsUrl);

                    if (resItems.ok) {
                        const itemsData = await resItems.json();

                        const rowsToInsert = itemsData.map(item => ({
                            item_nome: (item.descricao || item.materialOuServicoDescricao || "Sem nome").trim(),
                            item_descricao: item.materialOuServicoDescricao || null,
                            unidade: item.unidadeMedida || "un",
                            quantidade: item.quantidade || 1,
                            valor_unitario: item.valorUnitarioHomologado || item.valorUnitarioEstimado || 0,
                            valor_total: item.valorTotal || 0,
                            data_publicacao: dataPublicacao,
                            orgao_nome: orgaoNome,
                            orgao_cnpj: cnpj,
                            municipio: municipio,
                            uf: uf,
                            modalidade: modalidade,
                            sequencial_compra: seq,
                            ano_compra: ano,
                            link_pncp: `https://pncp.gov.br/app/editais/${cnpj}/${ano}/${seq}`
                        })).filter(i => i.valor_unitario > 0);

                        if (rowsToInsert.length > 0) {
                            // Inserir no Supabase via REST API
                            const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/referencia_pncp`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify(rowsToInsert)
                            });

                            if (!insertRes.ok) {
                                const errBody = await insertRes.text();
                                console.error(`      ❌ Erro ao salvar no banco: ${errBody}`);
                            } else {
                                totalSincronizado += rowsToInsert.length;
                                console.log(`      ✅ +${rowsToInsert.length} itens salvos.`);
                            }
                        }
                    }

                    // Delay entre contratos para evitar 429 (Too Many Requests)
                    await new Promise(r => setTimeout(r, 150));
                }

                if (pagina >= json.totalPaginas) break;
                pagina++;
            }
        }

        console.log(`\n✨ Sincronização Concluída! Total de itens em 2026: ${totalSincronizado}`);

    } catch (err) {
        console.error("🔴 Falha crítica no robô:", err);
    }
}

syncPNCP2026();
