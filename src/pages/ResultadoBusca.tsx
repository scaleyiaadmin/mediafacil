import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileCheck, Send, Building2, Calendar, MapPin, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

interface ItemEncontrado {
  id: string;
  fonte: string;
  descricao: string;
  dataPublicacao: string;
  valor: number;
  modalidade?: string;
  fornecedor?: string;
  cnpj?: string;
  comprador?: string;
  cidadeUf?: string;
  emitente?: string;
  tomador?: string;
}

interface ItemSolicitado {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  itensEncontrados: ItemEncontrado[];
}

const resultados: ItemSolicitado[] = [
  {
    id: "1",
    nome: "Caneta esferográfica azul",
    quantidade: 100,
    unidade: "UN",
    itensEncontrados: [
      {
        id: "1a",
        fonte: "PNCP",
        descricao: "Caneta esferográfica azul, ponta média",
        dataPublicacao: "05/01/2026",
        valor: 1.45,
        modalidade: "Pregão Eletrônico",
        fornecedor: "Papelaria Central Ltda",
        cnpj: "12.345.678/0001-90",
        comprador: "Prefeitura Municipal de São Paulo",
        cidadeUf: "São Paulo/SP"
      },
      {
        id: "1b",
        fonte: "BPS",
        descricao: "Caneta esferográfica cor azul",
        dataPublicacao: "03/01/2026",
        valor: 1.52,
        modalidade: "Dispensa de Licitação",
        fornecedor: "Atacadista Escolar ME",
        cnpj: "98.765.432/0001-10",
        comprador: "Hospital Municipal de Campinas",
        cidadeUf: "Campinas/SP"
      },
      {
        id: "1c",
        fonte: "NFe",
        descricao: "Caneta BIC azul cx c/ 50",
        dataPublicacao: "02/01/2026",
        valor: 1.38,
        emitente: "Distribuidora Escritório SA",
        tomador: "Secretaria de Educação",
        cidadeUf: "Ribeirão Preto/SP"
      },
    ]
  },
  {
    id: "2",
    nome: "Papel A4 500 folhas",
    quantidade: 50,
    unidade: "PCT",
    itensEncontrados: [
      {
        id: "2a",
        fonte: "PNCP",
        descricao: "Papel sulfite A4, 75g/m², 500 folhas",
        dataPublicacao: "04/01/2026",
        valor: 24.90,
        modalidade: "Pregão Eletrônico",
        fornecedor: "Papelaria Express Ltda",
        cnpj: "11.222.333/0001-44",
        comprador: "UFMG",
        cidadeUf: "Belo Horizonte/MG"
      },
      {
        id: "2b",
        fonte: "Painel de Preços",
        descricao: "Resma papel A4 branco",
        dataPublicacao: "01/01/2026",
        valor: 23.50,
        modalidade: "Ata de Registro de Preços",
        fornecedor: "Comercial de Papéis Ltda",
        cnpj: "55.666.777/0001-88",
        comprador: "Governo do Estado do RS",
        cidadeUf: "Porto Alegre/RS"
      },
    ]
  },
];

export default function ResultadoBusca() {
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

  const toggleExpandir = (itemId: string) => {
    setExpandido(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  return (
    <MainLayout title="Resultado da Busca" subtitle="Preços encontrados para os itens solicitados">
      <div className="space-y-6">
        {/* Resumo */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {resultados.reduce((acc, item) => acc + item.itensEncontrados.length, 0)} preços encontrados
              </p>
              <p className="text-sm text-muted-foreground">
                Para {resultados.length} itens solicitados
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/solicitar-fornecedores">
              <Button variant="outline" className="gap-2">
                <Send className="h-4 w-4" />
                Solicitar a Fornecedores
              </Button>
            </Link>
            <Link to="/relatorio-final">
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Finalizar Orçamento
              </Button>
            </Link>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="space-y-4">
          {resultados.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header do item */}
              <button
                onClick={() => toggleExpandir(item.id)}
                className="flex w-full items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-foreground text-left">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade} {item.unidade} • {item.itensEncontrados.length} preços encontrados
                    </p>
                  </div>
                </div>
                {expandido[item.id] ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Detalhes expandidos */}
              {expandido[item.id] && (
                <div className="border-t border-border divide-y divide-border">
                  {item.itensEncontrados.map((encontrado) => (
                    <div key={encontrado.id} className="p-4 bg-muted/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-accent text-accent-foreground mb-2">
                            {encontrado.fonte}
                          </span>
                          <p className="font-medium text-foreground">{encontrado.descricao}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          R$ {encontrado.valor.toFixed(2)}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{encontrado.dataPublicacao}</span>
                        </div>

                        {encontrado.modalidade && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{encontrado.modalidade}</span>
                          </div>
                        )}

                        {(encontrado.fornecedor || encontrado.emitente) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{encontrado.fornecedor || encontrado.emitente}</span>
                          </div>
                        )}

                        {encontrado.cidadeUf && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{encontrado.cidadeUf}</span>
                          </div>
                        )}
                      </div>

                      {encontrado.cnpj && (
                        <p className="text-xs text-muted-foreground mt-2">
                          CNPJ: {encontrado.cnpj}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
