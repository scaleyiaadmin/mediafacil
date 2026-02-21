
async function searchPNCPItems(termo) {
    console.log(`Searching for: ${termo}`);
    const hoje = new Date();

    // Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(hoje.getMonth() - 6);

    const formatDate = (d) => d.toISOString().split('T')[0].replace(/-/g, '');

    const dataInicial = formatDate(sixMonthsAgo);
    const dataFinal = formatDate(hoje);

    const modalidade = 6;

    const baseUrlConsulta = 'https://pncp.gov.br/api/consulta';
    const searchUrl = `${baseUrlConsulta}/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=15&termo=${encodeURIComponent(termo)}&codigoModalidadeContratacao=${modalidade}`;

    console.log(`[PNCP] Fetching contracts: ${searchUrl}`);
    const resContracts = await fetch(searchUrl);

    if (!resContracts.ok) {
        console.log(`Status: ${resContracts.status}`);
        console.log(await resContracts.text());
        return [];
    }

    const jsonContracts = await resContracts.json();
    const contratos = jsonContracts.data || [];
    console.log(`Found ${contratos.length} contracts.`);

    if (contratos.length === 0) return [];

    const baseUrlPncp = 'https://pncp.gov.br/api/pncp';
    const limitedContratos = contratos.slice(0, 3);

    const itemRequests = limitedContratos.map(async (contrato) => {
        try {
            if (!contrato.orgaoEntidade || !contrato.anoCompra || !contrato.sequencialCompra) return [];

            const { cnpj } = contrato.orgaoEntidade;
            const ano = contrato.anoCompra;
            const seq = contrato.sequencialCompra;

            const itemsUrl = `${baseUrlPncp}/v1/orgaos/${cnpj}/compras/${ano}/${seq}/itens`;
            console.log(`Fetching items for seq ${seq}...`);
            const resItems = await fetch(itemsUrl);

            if (!resItems.ok) {
                console.log(`Failed item fetch: ${resItems.status}`);
                return [];
            }

            const itemsData = await resItems.json();
            console.log(`  > Found ${itemsData.length} items in contract ${seq}`);

            // Filter
            const termoLower = termo.toLowerCase();
            return itemsData.filter(item => {
                const desc = (item.descricao || item.materialOuServicoDescricao || "").toLowerCase();
                return desc.includes(termoLower);
            }).map(item => ({
                nome: item.descricao || item.materialOuServicoDescricao,
                preco: item.valorUnitarioHomologado || item.valorUnitarioEstimado || 0
            }));

        } catch (e) {
            console.error(e);
            return [];
        }
    });

    const results = await Promise.all(itemRequests);
    return results.flat();
}

// Run test
searchPNCPItems('cadeira').then(items => {
    console.log(`\n\nTotal Items Found: ${items.length}`);
    if (items.length > 0) {
        console.log("Example:", items[0]);
    }
});
