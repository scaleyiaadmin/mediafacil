import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, FileCheck, Send, Building2, Calendar, MapPin, FileText, ArrowLeft, Loader2, AlertCircle, Sparkles, Filter } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQueries } from "@tanstack/react-query";
import { PNCPItem } from "@/lib/pncp";
import { searchAllSources } from "@/lib/searchAggregator";

interface ItemSolicitado {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  itemOriginal: any;
  itensEncontrados: PNCPItem[];
  loading: boolean;
  error: boolean;
}

export default function ResultadoBusca() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandido, setExpandido] = useState<Record<string, boolean>>({ "req-0": true });

  const itensSelecionados = (location.state?.itensSelecionados as any[]) || [];
  const nomeOrcamento = location.state?.nomeOrcamento;

  const filters = {
    includePNCP: true,
    includeBPS: true,
    includeCMED: true,
    includeSINAPI: true,
    includeNFe: true,
    uf: "all"
  };

  const queries = useQueries({
    queries: itensSelecionados.map((item) => ({
      queryKey: ["pncp-search-agg", item.nome, filters],
      queryFn: () => searchAllSources(item.nome, filters),
      staleTime: 1000 * 60 * 5,
      retry: 1,
    })),
  });

  const resultadosDetalhados: ItemSolicitado[] = useMemo(() => {
    return itensSelecionados.map((item, index) => {
      const query = queries[index];
      let itens = query.data || [];

      // Garantir que o item selecionado originalmente esteja na lista se ele tiver preço
      const jaExiste = itens.some(i => i.id === item.id);
      if (!jaExiste && item.preco > 0) {
        itens = [item, ...itens];
      }

      return {
        id: `req-${index}`,
        nome: item.nome,
        quantidade: item.quantidade,
        unidade: item.unidade || "unid",
        itemOriginal: item,
        itensEncontrados: itens,
        loading: query.isLoading,
        error: query.isError
      };
    });
  }, [itensSelecionados, queries]);

  const toggleExpandir = (itemId: string) => {
    setExpandido(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const totalEncontrados = resultadosDetalhados.reduce((acc, item) => acc + item.itensEncontrados.length, 0);
  const isLoadingAll = queries.some(q => q.isLoading);

  return (
    <MainLayout title="Resultado da Busca" subtitle="Preços encontrados para os itens solicitados">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Resumo Card */}
        <div className="flex flex-col md:flex-row items-center justify-between rounded-lg border border-border bg-card p-5 gap-6 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-tight">
                {isLoadingAll ? "0 preços encontrados" : `${totalEncontrados} preços encontrados`}
              </p>
              <p className="text-sm text-muted-foreground">
                Para {itensSelecionados.length} itens solicitados
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-2 flex-1 md:flex-none h-10 border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={totalEncontrados === 0}
              onClick={() => navigate("/solicitar-fornecedores", {
                state: { itens: resultadosDetalhados, nomeOrcamento }
              })}
            >
              <Send className="h-4 w-4" />
              Solicitar a Fornecedores
            </Button>
            <Button
              className="gap-2 flex-1 md:flex-none h-10 px-6 bg-[#D84B16] hover:bg-[#BF4213] text-white"
              disabled={totalEncontrados === 0}
              onClick={() => navigate("/relatorio-final", {
                state: { itens: resultadosDetalhados, nomeOrcamento }
              })}
            >
              <FileText className="h-4 w-4" />
              Finalizar Orçamento
            </Button>
          </div>
        </div>

        {/* Lista de itens solicitado */}
        <div className="space-y-4">
          {resultadosDetalhados.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
              {/* Header do item */}
              <button
                onClick={() => toggleExpandir(item.id)}
                className="flex w-full items-center justify-between p-5 hover:bg-muted/10 transition-colors"
              >
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-lg leading-tight">{item.nome}</p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {item.quantidade} {item.unidade} • {item.loading ? "Pesquisando..." : `${item.itensEncontrados.length} preços encontrados`}
                  </p>
                </div>
                {expandido[item.id] ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Detalhes expandidos */}
              {expandido[item.id] && (
                <div className="border-t border-border bg-white">
                  {item.itensEncontrados.length === 0 && !item.loading && (
                    <div className="p-8 text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum preço encontrado com os filtros atuais.</p>
                    </div>
                  )}

                  <div className="divide-y divide-border">
                    {item.itensEncontrados.map((encontrado) => {
                      const isOriginal = encontrado.id === item.itemOriginal.id;

                      let badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
                      let badgeDot = "bg-blue-500";

                      if (encontrado.fonte.includes("CMED") || encontrado.fonte.includes("BPS")) {
                        badgeColor = "bg-red-100 text-red-800 border-red-200";
                        badgeDot = "bg-red-500";
                      } else if (encontrado.fonte.includes("SINAPI") || encontrado.fonte.includes("SETOP")) {
                        badgeColor = "bg-green-100 text-green-800 border-green-200";
                        badgeDot = "bg-green-500";
                      } else if (encontrado.fonte.includes("CATSER") || encontrado.fonte.includes("CEASA")) {
                        badgeColor = "bg-purple-100 text-purple-800 border-purple-200";
                        badgeDot = "bg-purple-500";
                      } else if (encontrado.fonte.includes("NFe")) {
                        badgeColor = "bg-zinc-100 text-zinc-800 border-zinc-200";
                        badgeDot = "bg-zinc-500";
                      }

                      return (
                        <div
                          key={encontrado.id}
                          className={cn(
                            "p-5 transition-colors hover:bg-muted/5 group",
                            isOriginal && "bg-primary/5 border-l-4 border-l-primary"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border", badgeColor)}>
                                  <span className={cn("w-2 h-2 rounded-full", badgeDot)} />
                                  {encontrado.fonte}
                                </span>

                                {isOriginal && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-primary text-white">
                                    Original
                                  </span>
                                )}

                                {encontrado.metadata && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <Sparkles className="h-3 w-3" />
                                    {encontrado.metadata}
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                {encontrado.nome}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-black text-emerald-600 tabular-nums">
                                R$ {encontrado.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                                Preço Unitário
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/50 text-xs font-medium">
                            <div className="flex items-center gap-2.5 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                              <Calendar className="h-4 w-4 text-primary/60" />
                              <span>{encontrado.data || 'Data não inf.'}</span>
                            </div>

                            <div className="flex items-center gap-2.5 text-muted-foreground bg-muted/30 p-2 rounded-lg col-span-1 sm:col-span-2">
                              <Building2 className="h-4 w-4 text-primary/60" />
                              <span className="truncate">{encontrado.orgao || 'Órgão não informado'}</span>
                            </div>

                            {encontrado.cidadeUf && (
                              <div className="flex items-center gap-2.5 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                                <MapPin className="h-4 w-4 text-primary/60" />
                                <span>{encontrado.cidadeUf}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

// Helper function to concatenate classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
