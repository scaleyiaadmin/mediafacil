import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FileText, Database, Users, CheckCircle, Clock,
  ArrowRight, Edit, ArrowLeft, AlertCircle,
  RefreshCw, Package, Calendar, CalendarClock, Loader2
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PasswordConfirmDialog } from "@/components/PasswordConfirmDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";

interface OrcamentoDetalhe {
  id: string;
  nome: string;
  dataCriacao: string;
  dataFinalizacao?: string;
  dataLimite?: string;
  status: OrcamentoStatus;
  itens: { id: string; nome: string; descricao?: string; quantidade: number; unidade: string }[];
  fontes: string[];
  solicitacaoFornecedores: boolean;
  respostasRecebidas: number;
  totalSolicitacoes: number;
}

export default function VisaoOrcamento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orcamento, setOrcamento] = useState<OrcamentoDetalhe | null>(null);

  useEffect(() => {
    if (profile && id) {
      fetchOrcamento();
    }
  }, [id, profile]);

  async function fetchOrcamento() {
    if (!id || !profile) return;

    try {
      setLoading(true);
      // 1. Fetch Orcamento
      const { data: orc, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', id)
        .eq('entidade_id', profile.entidade_id)
        .single();

      if (orcError) throw orcError;

      // 2. Fetch Itens
      const { data: items, error: itemsError } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', id);

      if (itemsError) throw itemsError;

      // 3. Fetch fornecedores count
      const { count: totalSolicitacoes } = await supabase
        .from('orcamento_fornecedores')
        .select('*', { count: 'exact', head: true })
        .eq('orcamento_id', id);

      const { count: respostasRecebidas } = await supabase
        .from('orcamento_fornecedores')
        .select('*', { count: 'exact', head: true })
        .eq('orcamento_id', id)
        .eq('status', 'replied');

      setOrcamento({
        id: orc.id,
        nome: orc.nome,
        dataCriacao: new Date(orc.data_solicitacao).toLocaleDateString('pt-BR'),
        dataFinalizacao: orc.data_finalizacao ? new Date(orc.data_finalizacao).toLocaleDateString('pt-BR') : undefined,
        dataLimite: orc.data_limite ? new Date(orc.data_limite).toLocaleDateString('pt-BR') : undefined,
        status: orc.status as OrcamentoStatus,
        itens: (items || []).map(i => ({
          id: i.id,
          nome: i.nome,
          descricao: i.descricao,
          quantidade: i.quantidade,
          unidade: i.unidade || 'UN'
        })),
        fontes: ["PNCP"],
        solicitacaoFornecedores: (totalSolicitacoes || 0) > 0,
        respostasRecebidas: respostasRecebidas || 0,
        totalSolicitacoes: totalSolicitacoes || 0
      });

    } catch (error: any) {
      console.error("Erro ao carregar orçamento:", error);
      toast.error("Orçamento não encontrado ou acesso negado.");
      navigate("/orcamentos");
    } finally {
      setLoading(false);
    }
  }

  const isDraft = orcamento?.status === "draft";
  const isCompleted = orcamento?.status === "completed";
  const isDeadlineExpired = orcamento?.status === "deadline_expired";
  const canFinalize = orcamento?.status === "waiting_suppliers" || isDeadlineExpired;

  const handleFinalizeClick = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = () => {
    setShowPasswordDialog(false);
    navigate("/relatorio-final", {
      state: {
        itens: orcamento?.itens,
        nomeOrcamento: orcamento?.nome,
        entidade: profile?.entidade_id
      }
    });
  };

  if (loading) {
    return (
      <MainLayout title="Carregando Orçamento" subtitle="...">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!orcamento) return null;

  if (isCompleted) {
    return (
      <MainLayout title="Relatório Final" subtitle={orcamento.nome}>
        <div className="mx-auto max-w-4xl space-y-6">
          <Link to="/orcamentos">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-foreground">{orcamento.nome}</h2>
                <StatusBadge status={orcamento.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                Finalizado em {orcamento.dataFinalizacao}
              </p>
            </div>
          </div>

          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Orçamento Finalizado</h3>
            <p className="text-muted-foreground mb-6">Este orçamento já foi finalizado. Acesse o relatório completo abaixo.</p>
            <Link to="/relatorio-final" state={{ items: orcamento.itens, nomeOrcamento: orcamento.nome }}>
              <Button size="lg" className="gap-2">
                <FileText className="h-4 w-4" />
                Ver Relatório Final
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Visão do Orçamento" subtitle={orcamento.nome}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/orcamentos">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className={`rounded-lg border-l-4 bg-card p-6 shadow-sm ${isDeadlineExpired
          ? "border-l-destructive border border-destructive/20"
          : orcamento.status === "waiting_suppliers"
            ? "border-l-indigo-500/50 border border-indigo-500/10"
            : orcamento.status === "draft"
              ? "border-l-amber-500/50 border border-amber-500/10"
              : "border-l-emerald-500/50 border border-emerald-500/10"
          }`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{orcamento.nome}</h2>
                <StatusBadge status={orcamento.status} className="text-sm px-4 py-1.5" />
              </div>

              {isDeadlineExpired && (
                <div className="flex items-center gap-2 text-destructive text-sm mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">O prazo de 10 dias úteis para resposta dos fornecedores expirou</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm md:text-right md:min-w-[200px]">
              <div className="flex items-center gap-2 md:justify-end text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Criado em: <span className="font-medium text-foreground">{orcamento.dataCriacao}</span></span>
              </div>

              {orcamento.dataLimite && (
                <div className={`flex items-center gap-2 md:justify-end ${isDeadlineExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  <CalendarClock className="h-4 w-4" />
                  <span>Prazo limite: <span className={`font-medium ${isDeadlineExpired ? "text-destructive" : "text-foreground"}`}>{orcamento.dataLimite}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Itens Incluídos</h3>
              <p className="text-sm text-muted-foreground">{orcamento.itens.length} itens no orçamento</p>
            </div>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="p-4">
              <table className="w-full">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-muted-foreground w-[50%]">Item</th>
                    <th className="text-center py-2 px-3 text-sm font-semibold text-muted-foreground">Unidade</th>
                    <th className="text-center py-2 px-3 text-sm font-semibold text-muted-foreground">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamento.itens.map((item, index) => (
                    <tr key={item.id} className={`${index % 2 === 0 ? "bg-muted/20" : ""} hover:bg-muted/40 transition-colors`}>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.nome}</p>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold min-w-[50px]">
                          {item.unidade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-foreground text-base">{item.quantidade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{orcamento.fontes.length} Fontes</p>
                <p className="text-xs text-muted-foreground">Bases consultadas</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {orcamento.fontes.map((fonte) => (
                <span key={fonte} className="px-2 py-0.5 text-xs rounded-md bg-accent text-accent-foreground">
                  {fonte}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {orcamento.respostasRecebidas}/{orcamento.totalSolicitacoes} Respostas
                </p>
                <p className="text-xs text-muted-foreground">Links enviados</p>
              </div>
            </div>
            {orcamento.solicitacaoFornecedores ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Solicitações enviadas</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Nenhuma solicitação</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDeadlineExpired
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
                }`}>
                {isDeadlineExpired ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Progresso</p>
                <p className="text-xs text-muted-foreground">Status atual</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle className="h-3 w-3" />
                <span>{orcamento.itens.length} itens adicionados</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle className="h-3 w-3" />
                <span>{orcamento.fontes.length} fontes consultadas</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isDeadlineExpired ? "text-destructive font-bold" : "text-blue-600 font-medium"}`}>
                {isDeadlineExpired ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                <span>{isDeadlineExpired ? "Prazo encerrado" : "Aguardando fornecedores"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4 pb-6">
          {isDraft && (
            <Link to="/buscar-itens-manual">
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Continuar Editando
              </Button>
            </Link>
          )}

          {isDeadlineExpired && (
            <Link to={`/solicitar-fornecedores?resend=${id}`}>
              <Button variant="outline" className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <RefreshCw className="h-4 w-4" />
                Reenviar Solicitação
              </Button>
            </Link>
          )}

          {canFinalize && (
            <Button size="lg" className="gap-2" onClick={handleFinalizeClick}>
              Finalizar Orçamento
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <PasswordConfirmDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          onConfirm={handlePasswordConfirm}
          title="Finalizar Orçamento"
          description="Para finalizar o orçamento, confirme sua senha. Após finalizado, o relatório final será gerado."
        />
      </div>
    </MainLayout>
  );
}
