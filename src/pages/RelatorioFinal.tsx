import { Download, Printer, Building2, User, Calendar, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ItemRelatorio {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  precos: {
    fonte: string;
    valor: number;
  }[];
  media: number;
  mediana: number;
}

const relatorioData = {
  entidade: "Prefeitura Municipal de São Paulo",
  responsavel: "João da Silva",
  dataRelatorio: "11/01/2026",
  // Dados de fornecedores para o relatório
  fornecedoresSolicitados: ["Distribuidora Central Ltda", "Papelaria Express", "Office Supplies Brasil", "Mega Suprimentos", "Atacadão Materiais"],
  fornecedoresResponderam: ["Distribuidora Central Ltda", "Office Supplies Brasil", "Mega Suprimentos"],
  // Bases que efetivamente retornaram resultados
  basesComResultados: ["PNCP", "BPS", "Painel de Preços", "NFe"],
  itens: [
    {
      id: "1",
      nome: "Caneta esferográfica azul",
      unidade: "UN",
      quantidade: 100,
      precos: [
        { fonte: "PNCP", valor: 1.45 },
        { fonte: "BPS", valor: 1.52 },
        { fonte: "NFe", valor: 1.38 },
        { fonte: "Fornecedor A", valor: 1.40 },
        { fonte: "Fornecedor B", valor: 1.50 },
      ],
      media: 1.45,
      mediana: 1.45,
    },
    {
      id: "2",
      nome: "Papel A4 500 folhas",
      unidade: "PCT",
      quantidade: 50,
      precos: [
        { fonte: "PNCP", valor: 24.90 },
        { fonte: "Painel de Preços", valor: 23.50 },
        { fonte: "Fornecedor A", valor: 24.00 },
        { fonte: "Fornecedor C", valor: 25.50 },
      ],
      media: 24.48,
      mediana: 24.45,
    },
    {
      id: "3",
      nome: "Grampeador de mesa",
      unidade: "UN",
      quantidade: 10,
      precos: [
        { fonte: "BPS", valor: 18.90 },
        { fonte: "PNCP", valor: 19.50 },
        { fonte: "Fornecedor B", valor: 17.80 },
      ],
      media: 18.73,
      mediana: 18.90,
    },
  ] as ItemRelatorio[],
};

// Helper para formatar lista de bases com resultados
const formatarBasesConsultadas = (bases: string[]): string => {
  const nomesBases: Record<string, string> = {
    "PNCP": "Portal Nacional de Contratações Públicas (PNCP)",
    "BPS": "Banco de Preços em Saúde (BPS)",
    "Painel de Preços": "Painel de Preços do Governo Federal",
    "NFe": "Notas Fiscais Eletrônicas (NFe)",
  };
  
  return bases.map(base => nomesBases[base] || base).join(", ");
};

export default function RelatorioFinal() {
  return (
    <MainLayout title="Relatório Final" subtitle="Orçamento consolidado para impressão">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Ações do relatório */}
        <div className="flex items-center justify-end gap-3 print:hidden">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Relatório */}
        <div className="rounded-lg border border-border bg-card p-8 print:border-none print:p-0">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Relatório de Pesquisa de Preços
            </h1>
            <p className="text-muted-foreground">
              Sistema Média Fácil - Captação de Orçamentos
            </p>
          </div>

          {/* Identificação */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Entidade Solicitante</p>
                <p className="font-medium text-foreground">{relatorioData.entidade}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="font-medium text-foreground">{relatorioData.responsavel}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Data do Relatório</p>
                <p className="font-medium text-foreground">{relatorioData.dataRelatorio}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Metodologia */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Metodologia de Pesquisa de Preços</h2>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4 space-y-3">
              <p>
                A presente pesquisa de preços foi realizada por meio de consulta às bases públicas e referenciais que apresentaram resultados válidos para o objeto pesquisado, disponíveis no sistema, incluindo, conforme aplicável, {formatarBasesConsultadas(relatorioData.basesComResultados)} e demais tabelas habilitadas.
              </p>
              <p>
                Foram considerados exclusivamente os registros compatíveis com o objeto da contratação, observando-se a similaridade do item, a atualidade das informações e a abrangência geográfica definida pelo usuário, contemplando o período dos últimos 12 (doze) meses, em conformidade com as disposições da Lei nº 14.133/2021.
              </p>
              {relatorioData.fornecedoresSolicitados.length > 0 && (
                <p>
                  De forma complementar, quando aplicável, procedeu-se à solicitação de orçamentos junto a fornecedores do ramo de atividade correspondente, selecionados com base em critérios objetivos previamente estabelecidos no sistema. As solicitações foram encaminhadas aos seguintes fornecedores: {relatorioData.fornecedoresSolicitados.join(", ")}.
                  {relatorioData.fornecedoresResponderam.length > 0 && (
                    <> Dentre estes, apresentaram resposta à solicitação os fornecedores: {relatorioData.fornecedoresResponderam.join(", ")}.</>
                  )}
                </p>
              )}
              <p>
                Os valores obtidos, tanto das bases referenciais quanto das cotações recebidas, foram analisados de forma comparativa, com apuração de média e mediana dos preços considerados válidos, com a finalidade de subsidiar a adequada formação do preço de referência, observando-se os princípios da razoabilidade, economicidade e eficiência.
              </p>
              <p>
                A presente pesquisa de preços integra o processo administrativo e tem por finalidade subsidiar a tomada de decisão da Administração, não se caracterizando como proposta comercial.
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Tabela de itens */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Itens Pesquisados</h2>
            
            <div className="space-y-6">
              {relatorioData.itens.map((item) => (
                <div key={item.id} className="rounded-lg border border-border overflow-hidden">
                  {/* Header do item */}
                  <div className="bg-muted/30 px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade} {item.unidade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Média</p>
                        <p className="font-bold text-primary text-lg">
                          R$ {item.media.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preços por fonte */}
                  <div className="divide-y divide-border">
                    {item.precos.map((preco, index) => (
                      <div key={index} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span className="text-muted-foreground">{preco.fonte}</span>
                        <span className="font-medium text-foreground">R$ {preco.valor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Média e mediana */}
                  <div className="bg-accent/30 px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Média: </span>
                      <span className="font-semibold text-foreground">R$ {item.media.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mediana: </span>
                      <span className="font-semibold text-foreground">R$ {item.mediana.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Rodapé do relatório */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Documento gerado pelo Sistema Média Fácil</p>
            <p className="mt-1">{relatorioData.dataRelatorio}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
