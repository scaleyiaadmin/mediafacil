
const termo = 'cadeira';
const dataInicial = '20250101';
const dataFinal = '20251231';
const modalidade = 6; // Pregão
const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=1&tamanhoPagina=1&termo=${termo}&codigoModalidadeContratacao=${modalidade}`;

console.log(`Fetching: ${url}`);

try {
    const response = await fetch(url);
    if (!response.ok) {
        const text = await response.text();
        console.error(`HTTP error! status: ${response.status}`);
        console.error('Response body:', text);
    } else {
        const json = await response.json();
        console.log(`Success! Found ${json.totalRegistros} records.`);
    }
} catch (e) {
    console.error('Error:', e);
}
