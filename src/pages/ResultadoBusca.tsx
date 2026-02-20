import { useNavigate, useLocation } from "react-router-dom";
import { FileCheck, Building2, Calendar, MapPin, ArrowLeft, Sparkles, ShoppingBag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PNCPItem } from "@/lib/pncp";

export default function ResultadoBusca() {
  const navigate = useNavigate();
  const location = useLocation();

  const itensSelecionados = (location.state?.itensSelecionados as PNCPItem[]) || [];
  const nomeOrcamento = location.state?.nomeOrcamento || "Orçamento";

  const totalSelecionados = itensSelecionados.length;
  const valorTotal = itensSelecionados.reduce((acc, item) => acc + (item.preco || 0), 0);

  return (
    <MainLayout title="Resumo da Seleção" subtitle={nomeOrcamento}>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Botão Voltar */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Seleção
          </Button>
        </div>

        {/* Resumo */}
        <div className="flex flex-col md:flex-row items-center justify-between rounded-xl border border-border bg-card p-6 gap-4 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">
                {totalSelecionados} itens consolidados
              </p>
              <p className="text-sm text-muted-foreground">
                Total Estimado: <span className="font-semibold text-primary">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              className="gap-2 flex-1 md:flex-none h-11 px-6 shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/relatorio-final", {
                state: {
                  itens: itensSelecionados.map(i => ({ ...i, itensEncontrados: [i], loading: false, error: false })),
                  entidade: "Prefeitura Municipal",
                  responsavel: "Usuário",
                  nomeOrcamento
                }
              })}
            >
              <ShoppingBag className="h-4 w-4" />
              Finalizar Orçamento
            </Button>
          </div>
        </div>

        {/* Lista de itens selecionados */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 px-1">
            <FileCheck className="h-5 w-5 text-primary" />
            Itens que farão parte da Média
          </h3>

          <div className="grid gap-4">
            {itensSelecionados.length === 0 ? (
              <div className="p-12 text-center rounded-xl border-2 border-dashed border-border bg-muted/20">
                <p className="text-muted-foreground font-medium">Nenhum item foi selecionado ainda.</p>
                <Button variant="link" onClick={() => navigate(-1)} className="mt-2 text-primary">
                  Voltar e pesquisar novamente
                </Button>
              </div>
            ) : (
              itensSelecionados.map((item) => {
                // Determine badge color
                let badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
                let badgeDot = "bg-blue-500";

                if (item.fonte.includes("CMED") || item.fonte.includes("BPS")) {
                  badgeColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
                  badgeDot = "bg-red-500";
                } else if (item.fonte.includes("SINAPI") || item.fonte.includes("SETOP")) {
                  badgeColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
                  badgeDot = "bg-green-500";
                } else if (item.fonte.includes("CATSER") || item.fonte.includes("CEASA")) {
                  badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
                  badgeDot = "bg-purple-500";
                } else if (item.fonte.includes("NFe")) {
                  badgeColor = "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";
                  badgeDot = "bg-zinc-500";
                }

                return (
                  <div key={item.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${badgeColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                            {item.fonte}
                          </span>
                          {item.metadata && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                              <Sparkles className="h-3 w-3" />
                              {item.metadata}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-foreground text-lg leading-tight">{item.nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-emerald-600">
                          R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium uppercase mt-1">
                          Preço Referencial
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">{item.data || "Referência Atual"}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate font-medium" title={item.orgao}>{item.orgao || "Órgão Não Informado"}</span>
                      </div>

                      {item.cidadeUf && (
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium">{item.cidadeUf}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
