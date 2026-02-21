import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileCheck, Building2, Calendar, MapPin, ArrowLeft, Sparkles, Send, FileText, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PNCPItem } from "@/lib/pncp";
import { useAuth } from "@/contexts/AuthContext";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ItemSelecionado extends PNCPItem {
  quantidade: number;
}

export default function ResultadoBusca() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, entidade } = useAuth();
  const { createOrcamento } = useOrcamentos();

  const itensSelecionados = (location.state?.itensSelecionados as ItemSelecionado[]) || [];
  const nomeOrcamento = location.state?.nomeOrcamento || "Orçamento";
  const orcamentoId = location.state?.orcamentoId as string | undefined; // ID do rascunho já salvo

  const [isFinalizing, setIsFinalizing] = useState(false);

  const totalSelecionados = itensSelecionados.length;

  // Cálculo do Valor Total considerando QUANTIDADE
  const valorTotal = itensSelecionados.reduce((acc, item) =>
    acc + ((item.preco || 0) * (item.quantidade || 1)), 0);

  // Estatísticas dos Preços Unitários
  const precosUnitarios = itensSelecionados.map(i => i.preco || 0).sort((a, b) => a - b);
  const somaUnitarios = precosUnitarios.reduce((a, b) => a + b, 0);
  const mediaUnitaria = precosUnitarios.length > 0 ? somaUnitarios / precosUnitarios.length : 0;

  const meio = Math.floor(precosUnitarios.length / 2);
  const medianaUnitaria = precosUnitarios.length === 0 ? 0 : (
    precosUnitarios.length % 2 !== 0
      ? precosUnitarios[meio]
      : (precosUnitarios[meio - 1] + precosUnitarios[meio]) / 2
  );

  const handleSave = async (status: "waiting_suppliers" | "completed") => {
    if (itensSelecionados.length === 0) {
      toast.error("Nenhum item para salvar.");
      return;
    }
    setIsFinalizing(true);
    try {
      let idFinal = orcamentoId;

      if (idFinal) {
        // Atualizar itens do rascunho existente
        await supabase.from('orcamento_itens').delete().eq('orcamento_id', idFinal);
        const { error: itensErr } = await supabase.from('orcamento_itens').insert(
          itensSelecionados.map(i => ({
            orcamento_id: idFinal,
            nome: i.nome,
            descricao: i.fonte || null,
            unidade: i.unidade || 'UN',
            quantidade: i.quantidade || 1,
            valor_referencia: i.preco || 0
          }))
        );
        if (itensErr) throw itensErr;

        // Atualizar status do orçamento
        const { error: statusErr } = await supabase
          .from('orcamentos')
          .update({ status })
          .eq('id', idFinal);
        if (statusErr) throw statusErr;
      } else {
        // Criar novo com os itens e status correto
        const orc = await createOrcamento(nomeOrcamento, itensSelecionados, [], status);
        if (orc) idFinal = orc.id;
      }

      if (status === "waiting_suppliers") {
        navigate("/solicitar-fornecedores", {
          state: {
            orcamentoId: idFinal,
            itens: itensSelecionados,
            nomeOrcamento,
          }
        });
      } else {
        navigate("/relatorio-final", {
          state: {
            orcamentoId: idFinal,
            itens: itensSelecionados,
            nomeOrcamento,
          }
        });
      }
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

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

        {/* Resumo Compacto */}
        <div className="flex flex-col md:flex-row items-center justify-between rounded-lg border border-border bg-card p-4 gap-4 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">
                {totalSelecionados} itens consolidados
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <p className="text-[11px] text-muted-foreground">
                  Média: <span className="font-semibold text-foreground">R$ {mediaUnitaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Mediana: <span className="font-semibold text-foreground">R$ {medianaUnitaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </p>
                <p className="text-[11px] text-primary font-bold">
                  Total Geral: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-2 flex-1 md:flex-none h-9 px-4 text-xs font-semibold shadow-sm"
              onClick={() => handleSave("waiting_suppliers")}
              disabled={isFinalizing}
            >
              <Send className="h-3.5 w-3.5" /> Solicitar a Fornecedores
            </Button>
            <Button
              className="gap-2 flex-1 md:flex-none h-9 px-4 text-xs font-semibold shadow-sm"
              onClick={() => handleSave("completed")}
              disabled={isFinalizing}
            >
              <FileText className="h-3.5 w-3.5" /> Finalizar Orçamento
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

                const totalPorItem = (item.preco || 0) * (item.quantidade || 1);

                return (
                  <div key={item.id} className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${badgeColor}`}>
                            <span className={`w-1 h-1 rounded-full ${badgeDot}`} />
                            {item.fonte}
                          </span>
                          {item.metadata && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-100 dark:border-amber-800 uppercase tracking-wider">
                              <Sparkles className="h-2.5 w-2.5" />
                              {item.metadata}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800 uppercase tracking-wider">
                            Qtd: {item.quantidade || 1}
                          </span>
                        </div>
                        <p className="font-bold text-foreground text-sm uppercase leading-tight tracking-tight">{item.nome}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase opacity-70">Total do Item</p>
                        <p className="text-lg font-black text-emerald-600">
                          R$ {totalPorItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / un
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/40 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 opacity-60" />
                        <span>{item.data || "Referência Atual"}</span>
                      </div>

                      <div className="flex items-center gap-1.5 max-w-[250px]">
                        <Building2 className="h-3 w-3 opacity-60" />
                        <span className="truncate" title={item.orgao}>{item.orgao || "Órgão Não Informado"}</span>
                      </div>

                      {item.cidadeUf && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 opacity-60" />
                          <span>{item.cidadeUf}</span>
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
