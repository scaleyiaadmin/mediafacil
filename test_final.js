
const termo = 'cadeira';
const dataInicial = '20250101';
const dataFinal = '20251231';
const modalidade = 6; // Pregão
const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=10&termo=${termo}&codigoModalidadeContratacao=${modalidade}`;
// Teste sem modalidade também
const urlSemMod = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=10&termo=${termo}`;

console.log(`Fetching with Modality: ${url}`);
try {
    const response = await fetch(url);
    if (!response.ok) {
        console.log(`With Modality Failed: ${response.status} - ${await response.text()}`);
    } else {
        const json = await response.json();
        console.log(`With Modality Success! Found ${json.totalRegistros} records.`);
        if (json.data && json.data.length > 0) {
            console.log("First record has items?", !!json.data[0].itens);
        }
    }
} catch (e) {
    console.error('Error With Modality:', e);
}

console.log(`\nFetching WITHOUT Modality: ${urlSemMod}`);
try {
    const response = await fetch(urlSemMod);
    if (!response.ok) {
        console.log(`Without Modality Failed: ${response.status} - ${await response.text()}`);
    } else {
        const json = await response.json();
        console.log(`Without Modality Success! Found ${json.totalRegistros} records.`);
    }
} catch (e) {
    console.error('Error Without Modality:', e);
}
