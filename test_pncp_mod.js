
// No imports needed for fetch in Node 18+

async function run() {
    try {
        console.log("--- Fetching Modalities (Corrected Endpoint) ---");
        // Try simple /modalidades first
        let resMod = await fetch('https://pncp.gov.br/api/consulta/v1/modalidades');
        if (!resMod.ok) {
            console.log("/modalidades failed, trying /dominio/modalidade-contratacao");
            // Some APIs use domain endpoints
            resMod = await fetch('https://pncp.gov.br/api/consulta/v1/dominio/modalidade-contratacao');
        }

        if (resMod.ok) {
            const mods = await resMod.json();
            console.log("Modalities found:", mods.length);

            if (mods.length > 0) {
                // Find 'Dispensa de Licitação' or 'Pregão'
                const dispensa = mods.find(m => m.nome.toLowerCase().includes('dispensa'));
                const pregao = mods.find(m => m.nome.toLowerCase().includes('pregão'));

                const mod = dispensa || pregao || mods[0];
                const modId = mod.id;

                console.log(`\n--- Searching with Modalidade ID: ${modId} (${mod.nome}) ---`);

                const termo = 'cadeira';
                const dataInicial = '20250101';
                const dataFinal = '20251231';

                // Construct URL with modality
                const searchUrl = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=1&termo=${termo}&codigoModalidadeContratacao=${modId}`;

                const resSearch = await fetch(searchUrl);

                if (resSearch.ok) {
                    const searchData = await resSearch.json();
                    console.log("Search Results Total:", searchData.totalRegistros);

                    if (searchData.data && searchData.data.length > 0) {
                        const first = searchData.data[0];
                        console.log("First Result:", JSON.stringify(first, null, 2));

                        // Check for Items structure inside contract
                        if (first.itens) {
                            console.log("BINGO: ITEMS FOUND DIRECTLY IN SEARCH!");
                        } else {
                            console.log("Items NOT found in contract object. Must fetch via specific item endpoint.");

                            // Try to fetch items
                            if (first.orgaoEntidade && first.anoCompra && first.sequencialCompra) {
                                const cnpj = first.orgaoEntidade.cnpj;
                                const ano = first.anoCompra;
                                const seq = first.sequencialCompra;

                                // Note: Item endpoint is usually on /pncp not /consulta, or vice versa
                                // The original code used /api/pncp for items. Let's try both.

                                const itemsUrlPncp = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens`;
                                console.log(`Fetching items from (PNCP API): ${itemsUrlPncp}`);

                                const resItems = await fetch(itemsUrlPncp);
                                if (resItems.ok) {
                                    const items = await resItems.json();
                                    console.log(`Items found: ${items.length}`);
                                    console.log("First Item:", JSON.stringify(items[0], null, 2));
                                } else {
                                    console.log(`Failed to fetch items from PNCP API: ${resItems.status}`);
                                }
                            }
                        }
                    } else {
                        console.log("No results found search.");
                    }
                } else {
                    console.log("Search failed:", resSearch.status, await resSearch.text());
                }
            }
        } else {
            console.log("Failed to fetch modalities (both attempts):", resMod.status);
        }
    } catch (e) {
        console.error(e);
    }
}

run();
