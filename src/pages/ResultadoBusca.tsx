import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, FileCheck, Send, Building2, Calendar, MapPin, FileText, ArrowLeft, Loader2, AlertCircle, Filter, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueries } from "@tanstack/react-query";
import { PNCPItem } from "@/lib/pncp";
import { searchAllSources } from "@/lib/searchAggregator";

interface ItemSolicitado {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  itensEncontrados: PNCPItem[];
  loading: boolean;
  error: boolean;
}

export default function ResultadoBusca() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

  // Filters State
  const [filters, setFilters] = useState({
    includePNCP: true,
    includeBPS: true,
    includeSINAPI: true,
    uf: "all"
  });

  const itensSelecionados = (location.state?.itensSelecionados as { nome: string; quantidade: number }[]) || [];
  const nomeOrcamento = location.state?.nomeOrcamento;

  // Realizar buscas em paralelo para cada item solicitado use searchAllSources
  // Note: searchAllSources fetches everything then filters. 
  // Should we re-fetch when filters change? 
  // Ideally yes if filters affect the API call, but our "Source" filter is post-process in searchAggregator.
  // HOWEVER, the `searchAllSources` I wrote filters *after* fetching. So we can just fetch once and filter in UI?
  // actually `searchAllSources` takes filters as arg. So let's pass them.
  // But react-query keys should include filters then.

  const queries = useQueries({
    queries: itensSelecionados.map((item) => ({
      queryKey: ["pncp-search-agg", item.nome, filters],
      queryFn: () => searchAllSources(item.nome, filters),
      staleTime: 1000 * 60 * 5,
      retry: 1,
    })),
  });

  // Combinar resultados
  const resultadosDetalhados: ItemSolicitado[] = useMemo(() => {
    return itensSelecionados.map((item, index) => {
      const query = queries[index];
      let itens = query.data || [];

      // Filter by UF if selected
      if (filters.uf !== "all") {
        itens = itens.filter(i => i.cidadeUf?.includes(filters.uf));
      }

      return {
        id: `req-${index}`,
        nome: item.nome,
        quantidade: item.quantidade,
        unidade: "unid",
        itensEncontrados: itens,
        loading: query.isLoading,
        error: query.isError
      };
    });
  }, [itensSelecionados, queries, filters.uf]);

  const toggleExpandir = (itemId: string) => {
    setExpandido(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const totalEncontrados = resultadosDetalhados.reduce((acc, item) => acc + item.itensEncontrados.length, 0);
  const isLoadingAll = queries.some(q => q.isLoading);

  const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  return (
    <MainLayout title="Resultado da Busca" subtitle="Preços encontrados no PNCP, BPS (Est.) e SINAPI (Est.)">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar de Filtros */}
        <aside className="w-full lg:w-64 space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Filter className="h-4 w-4" />
              Filtros
            </div>

            <div className="space-y-3">
              <Label>Fontes de Dados</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pncp"
                  checked={filters.includePNCP}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, includePNCP: !!c }))}
                />
                <Label htmlFor="pncp" className="font-normal cursor-pointer flex items-center gap-2">
                  PNCP
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bps"
                  checked={filters.includeBPS}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, includeBPS: !!c }))}
                />
                <Label htmlFor="bps" className="font-normal cursor-pointer flex items-center gap-2">
                  BPS (Saúde)
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sinapi"
                  checked={filters.includeSINAPI}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, includeSINAPI: !!c }))}
                />
                <Label htmlFor="sinapi" className="font-normal cursor-pointer flex items-center gap-2">
                  SINAPI (Obras)
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Localização (UF)</Label>
              <Select value={filters.uf} onValueChange={(val) => setFilters(prev => ({ ...prev, uf: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {ufs.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 space-y-6">
          {/* Botão Voltar */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Lista
            </Button>
          </div>

          {/* Resumo */}
          <div className="flex flex-col md:flex-row items-center justify-between rounded-lg border border-border bg-card p-4 gap-4 shadow-sm">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isLoadingAll ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileCheck className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {isLoadingAll ? "Buscando nas bases..." : `${totalEncontrados} preços encontrados`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Para {itensSelecionados.length} itens solicitados
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="gap-2 flex-1 md:flex-none"
                disabled={totalEncontrados === 0}
                onClick={() => navigate("/solicitar-fornecedores", {
                  state: {
                    itens: resultadosDetalhados,
                    entidade: "Prefeitura Municipal de São Paulo",
                    responsavel: "João da Silva",
                    nomeOrcamento
                  }
                })}
              >
                <Send className="h-4 w-4" />
                Solicitar a Fornecedores
              </Button>
              <Button
                className="gap-2 flex-1 md:flex-none"
                disabled={totalEncontrados === 0}
                onClick={() => navigate("/relatorio-final", {
                  state: {
                    itens: resultadosDetalhados,
                    entidade: "Prefeitura Municipal de São Paulo",
                    responsavel: "João da Silva",
                    nomeOrcamento
                  }
                })}
              >
                <FileText className="h-4 w-4" />
                Finalizar Orçamento
              </Button>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="space-y-4">
            {resultadosDetalhados.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
                {/* Header do item */}
                <button
                  onClick={() => toggleExpandir(item.id)}
                  className="flex w-full items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {item.loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    <div>
                      <p className="font-semibold text-foreground text-left text-lg">{item.nome}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {item.quantidade} {item.unidade}
                        <span className="w-1 h-1 rounded-full bg-border" />
                        {item.loading ? "Pesquisando..." : `${item.itensEncontrados.length} resultados`}
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
                    {item.itensEncontrados.length === 0 && !item.loading && (
                      <div className="p-8 text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum preço encontrado com os filtros atuais.</p>
                      </div>
                    )}

                    {item.itensEncontrados.map((encontrado) => {
                      // Determine badge color
                      let badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
                      let badgeDot = "bg-blue-500";

                      if (encontrado.fonte.includes("BPS")) {
                        badgeColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
                        badgeDot = "bg-red-500";
                      } else if (encontrado.fonte.includes("SINAPI")) {
                        badgeColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
                        badgeDot = "bg-green-500";
                      }

                      return (
                        <div key={encontrado.id} className="p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${badgeColor}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                                  {encontrado.fonte}
                                </span>
                                {encontrado.metadata && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                                    <Sparkles className="h-3 w-3" />
                                    {encontrado.metadata}
                                  </span>
                                )}
                                {encontrado.modalidade && (
                                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                    {encontrado.modalidade}
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-foreground text-sm line-clamp-2" title={encontrado.nome}>{encontrado.nome}</p>
                            </div>
                            <p className="text-lg font-bold text-emerald-600 whitespace-nowrap">
                              R$ {encontrado.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 text-xs text-muted-foreground mt-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{encontrado.data}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate" title={encontrado.orgao}>{encontrado.orgao}</span>
                            </div>

                            {encontrado.cidadeUf && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{encontrado.cidadeUf}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
