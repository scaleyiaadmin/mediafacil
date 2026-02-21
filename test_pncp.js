
const termo = 'cadeira';
const dataInicial = '20250101';
const dataFinal = '20251231';
const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=1&termo=${termo}`;

console.log(`Fetching: ${url}`);

try {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
    });

    console.log(`Status: ${response.status}`);

    if (!response.ok) {
        const text = await response.text();
        console.log('Error Body:', text);
    } else {
        const json = await response.json();
        const firstItem = json.data && json.data.length > 0 ? json.data[0] : null;
        console.log('Total Results:', json.totalRegistros);
        if (firstItem) {
            console.log('Example Contract:', JSON.stringify(firstItem, null, 2));
            // Check if items are in the contract structure
            if (firstItem.itens) {
                console.log('ITEMS FOUND INSIDE CONTRACT!');
            } else {
                console.log('Items NOT found inside contract structure.');
            }
        }
    }
} catch (e) {
    console.error('Exception:', e);
}
