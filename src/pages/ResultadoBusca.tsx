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
    <MainLayout
      title="Preços encontrados para os itens solicitados"
      hideSidebar={true}
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        {/* Resumo Card */}
        <div className="flex flex-col md:flex-row items-center justify-between rounded-xl border border-slate-100 bg-card p-8 gap-8 shadow-sm">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
              <FileCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoadingAll
                  ? "Buscando preços..."
                  : `${totalEncontrados} ${totalEncontrados === 1 ? 'preço encontrado' : 'preços encontrados'}`
                }
              </p>
              <p className="text-base text-slate-500 font-medium mt-1">
                Para {itensSelecionados.length} {itensSelecionados.length === 1 ? 'item solicitado' : 'itens solicitados'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-3 flex-1 md:flex-none h-12 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-6 shadow-sm transition-all active:scale-95"
              disabled={totalEncontrados === 0}
              onClick={() => navigate("/solicitar-fornecedores", {
                state: { itens: resultadosDetalhados, nomeOrcamento }
              })}
            >
              <Send className="h-4 w-4" />
              Solicitar a Fornecedores
            </Button>
            <Button
              className="gap-3 flex-1 md:flex-none h-12 px-8 bg-[#D84B16] hover:bg-[#BF4213] text-white font-bold shadow-lg shadow-[#D84B16]/10 transition-all active:scale-95 border-none"
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
        <div className="space-y-6">
          {resultadosDetalhados.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header do item */}
              <button
                onClick={() => toggleExpandir(item.id)}
                className="flex w-full items-center justify-between p-8 hover:bg-muted/5 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-xl leading-tight group-hover:text-primary transition-colors">{item.nome}</p>
                  <p className="text-base text-slate-500 mt-2 font-medium">
                    {item.quantidade} {item.unidade} • {item.loading ? "Pesquisando referências..." : `${item.itensEncontrados.length} preços encontrados`}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors">
                  {expandido[item.id] ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandido[item.id] && (
                <div className="border-t border-slate-50 bg-white">
                  {item.itensEncontrados.length === 0 && !item.loading && (
                    <div className="p-12 text-center text-slate-400">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium">Nenhum preço encontrado com os filtros atuais.</p>
                      <p className="mt-1 text-sm">Tente ampliar sua busca ou mudar o período.</p>
                    </div>
                  )}

                  <div className="divide-y divide-slate-50">
                    {item.itensEncontrados.map((encontrado) => {
                      const isOriginal = encontrado.id === item.itemOriginal.id;

                      let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                      let badgeDot = "bg-blue-500";

                      if (encontrado.fonte.includes("CMED") || encontrado.fonte.includes("BPS")) {
                        badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                        badgeDot = "bg-rose-500";
                      } else if (encontrado.fonte.includes("SINAPI") || encontrado.fonte.includes("SETOP")) {
                        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        badgeDot = "bg-emerald-500";
                      } else if (encontrado.fonte.includes("CATSER") || encontrado.fonte.includes("CEASA")) {
                        badgeColor = "bg-violet-50 text-violet-700 border-violet-100";
                        badgeDot = "bg-violet-500";
                      } else if (encontrado.fonte.includes("NFe")) {
                        badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                        badgeDot = "bg-slate-500";
                      }

                      return (
                        <div
                          key={encontrado.id}
                          className={cn(
                            "p-8 transition-colors hover:bg-slate-50/50 group",
                            isOriginal && "bg-primary/5 border-l-4 border-l-primary"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border", badgeColor)}>
                                  <span className={cn("w-2 h-2 rounded-full", badgeDot)} />
                                  {encontrado.fonte}
                                </span>

                                {isOriginal && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-primary text-white">
                                    Selecionado
                                  </span>
                                )}

                                {encontrado.metadata && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <Sparkles className="h-3 w-3" />
                                    {encontrado.metadata}
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-slate-900 text-lg leading-snug">
                                {encontrado.nome}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-3xl font-black text-emerald-600 tabular-nums tracking-tight">
                                R$ {encontrado.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">
                                Valor Unitário
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-50 text-sm font-bold">
                            <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <Calendar className="h-5 w-5 text-primary/40" />
                              <span className="tabular-nums">{encontrado.data || '00/00/0000'}</span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                              <Building2 className="h-5 w-5 text-primary/40" />
                              <span className="truncate">{encontrado.orgao || 'Prefeitura Municipal'}</span>
                            </div>

                            {encontrado.cidadeUf && (
                              <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <MapPin className="h-5 w-5 text-primary/40" />
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
