import { Link, useParams, useNavigate } from "react-router-dom";
import { FileText, Database, Users, CheckCircle, Clock, ArrowRight, Edit, ArrowLeft, AlertCircle, RefreshCw, Package, Calendar, CalendarClock } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PasswordConfirmDialog } from "@/components/PasswordConfirmDialog";
import { useState } from "react";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";

// Mock data for different budgets
const orcamentosData: Record<string, {
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
}> = {
  "1": {
    id: "1",
    nome: "Material de escritório - Secretaria de Educação",
    dataCriacao: "10/01/2026",
    dataFinalizacao: "11/01/2026",
    status: "completed",
    itens: [
      { id: "1", nome: "Caneta esferográfica azul", descricao: "Ponta fina 0.7mm", quantidade: 100, unidade: "UN" },
      { id: "2", nome: "Papel A4 500 folhas", descricao: "Sulfite branco 75g/m²", quantidade: 50, unidade: "PCT" },
      { id: "3", nome: "Grampeador de mesa", descricao: "Capacidade 25 folhas", quantidade: 10, unidade: "UN" },
      { id: "4", nome: "Clips niquelado", descricao: "Tamanho 2/0", quantidade: 500, unidade: "CX" },
      { id: "5", nome: "Borracha branca", descricao: "Macia para lápis", quantidade: 200, unidade: "UN" },
      { id: "6", nome: "Lápis grafite", descricao: "Nº 2 HB", quantidade: 300, unidade: "UN" },
      { id: "7", nome: "Apontador com depósito", quantidade: 50, unidade: "UN" },
      { id: "8", nome: "Régua 30cm", descricao: "Transparente", quantidade: 80, unidade: "UN" },
      { id: "9", nome: "Tesoura escolar", descricao: "Ponta arredondada", quantidade: 40, unidade: "UN" },
      { id: "10", nome: "Cola branca 90g", quantidade: 120, unidade: "UN" },
    ],
    fontes: ["PNCP", "BPS", "Painel de Preços", "NFe"],
    solicitacaoFornecedores: true,
    respostasRecebidas: 5,
    totalSolicitacoes: 8,
  },
  "2": {
    id: "2",
    nome: "Equipamentos de informática - TI",
    dataCriacao: "09/01/2026",
    dataLimite: "23/01/2026",
    status: "waiting_suppliers",
    itens: [
      { id: "1", nome: "Monitor LED 24 polegadas", descricao: "Full HD 1920x1080, entrada HDMI", quantidade: 20, unidade: "UN" },
      { id: "2", nome: "Teclado USB ABNT2", descricao: "Layout brasileiro com Ç", quantidade: 30, unidade: "UN" },
      { id: "3", nome: "Mouse óptico USB", descricao: "1000 DPI, ergonômico", quantidade: 30, unidade: "UN" },
      { id: "4", nome: "Webcam HD 720p", descricao: "Com microfone integrado", quantidade: 15, unidade: "UN" },
      { id: "5", nome: "Headset com microfone", descricao: "USB, cancelamento de ruído", quantidade: 15, unidade: "UN" },
    ],
    fontes: ["PNCP", "Painel de Preços"],
    solicitacaoFornecedores: true,
    respostasRecebidas: 3,
    totalSolicitacoes: 12,
  },
  "4": {
    id: "4",
    nome: "Material de limpeza - Prefeitura",
    dataCriacao: "07/01/2026",
    dataLimite: "21/01/2026",
    status: "deadline_expired",
    itens: [
      { id: "1", nome: "Detergente 500ml", descricao: "Neutro, biodegradável", quantidade: 100, unidade: "UN" },
      { id: "2", nome: "Desinfetante 2L", descricao: "Lavanda ou pinho", quantidade: 50, unidade: "UN" },
      { id: "3", nome: "Papel higiênico", descricao: "Folha dupla, 30m", quantidade: 200, unidade: "FD" },
      { id: "4", nome: "Sabonete líquido 1L", descricao: "Neutro, refil", quantidade: 60, unidade: "UN" },
      { id: "5", nome: "Álcool 70% 1L", quantidade: 80, unidade: "UN" },
      { id: "6", nome: "Luvas de látex", descricao: "Tamanho M", quantidade: 100, unidade: "PAR" },
    ],
    fontes: ["PNCP", "BPS", "NFe"],
    solicitacaoFornecedores: true,
    respostasRecebidas: 2,
    totalSolicitacoes: 6,
  },
};

export default function VisaoOrcamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Get budget data or use default
  const orcamentoData = orcamentosData[id || "1"] || orcamentosData["1"];
  
  const isDraft = orcamentoData.status === "draft";
  const isCompleted = orcamentoData.status === "completed";
  const isDeadlineExpired = orcamentoData.status === "deadline_expired";
  const canFinalize = orcamentoData.status === "waiting_suppliers" || isDeadlineExpired;

  const handleFinalizeClick = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = () => {
    setShowPasswordDialog(false);
    navigate("/relatorio-final");
  };

  // If completed, redirect to final report
  if (isCompleted) {
    return (
      <MainLayout title="Relatório Final" subtitle={orcamentoData.nome}>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back button */}
          <Link to="/orcamentos">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>

          {/* Header com status */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-foreground">{orcamentoData.nome}</h2>
                <StatusBadge status={orcamentoData.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                Finalizado em {orcamentoData.dataFinalizacao}
              </p>
            </div>
          </div>

          {/* Redirect message */}
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Orçamento Finalizado</h3>
            <p className="text-muted-foreground mb-6">Este orçamento já foi finalizado. Acesse o relatório completo abaixo.</p>
            <Link to="/relatorio-final">
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
    <MainLayout title="Visão do Orçamento" subtitle={orcamentoData.nome}>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back button */}
        <Link to="/orcamentos">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        {/* ===== CARD SUPERIOR: Nome + Status + Datas ===== */}
        <div className={`rounded-lg border-l-4 bg-card p-6 shadow-sm ${
          isDeadlineExpired 
            ? "border-l-destructive border border-destructive/20" 
            : orcamentoData.status === "waiting_suppliers"
              ? "border-l-info border border-info/20"
              : orcamentoData.status === "draft"
                ? "border-l-warning border border-warning/20"
                : "border-l-success border border-success/20"
        }`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Título e Status */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{orcamentoData.nome}</h2>
                <StatusBadge status={orcamentoData.status} className="text-sm px-4 py-1.5" />
              </div>
              
              {isDeadlineExpired && (
                <div className="flex items-center gap-2 text-destructive text-sm mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">O prazo de 10 dias úteis para resposta dos fornecedores expirou</span>
                </div>
              )}
            </div>

            {/* Datas */}
            <div className="flex flex-col gap-2 text-sm md:text-right md:min-w-[200px]">
              <div className="flex items-center gap-2 md:justify-end text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Criado em: <span className="font-medium text-foreground">{orcamentoData.dataCriacao}</span></span>
              </div>
              
              {orcamentoData.dataLimite && (
                <div className={`flex items-center gap-2 md:justify-end ${isDeadlineExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  <CalendarClock className="h-4 w-4" />
                  <span>Prazo limite: <span className={`font-medium ${isDeadlineExpired ? "text-destructive" : "text-foreground"}`}>{orcamentoData.dataLimite}</span></span>
                </div>
              )}
              
              {orcamentoData.dataFinalizacao && (
                <div className="flex items-center gap-2 md:justify-end text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>Finalizado em: <span className="font-medium">{orcamentoData.dataFinalizacao}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== CARD GRANDE CENTRAL: Itens Incluídos ===== */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">Itens Incluídos</h3>
              <p className="text-sm text-muted-foreground">{orcamentoData.itens.length} itens no orçamento</p>
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
                  {orcamentoData.itens.map((item, index) => (
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

        {/* ===== CARDS MENORES: Fontes, Respostas, Progresso ===== */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Fontes utilizadas - Compacto */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{orcamentoData.fontes.length} Fontes</p>
                <p className="text-xs text-muted-foreground">Bases consultadas</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {orcamentoData.fontes.map((fonte) => (
                <span
                  key={fonte}
                  className="px-2 py-0.5 text-xs rounded-md bg-accent text-accent-foreground"
                >
                  {fonte}
                </span>
              ))}
            </div>
          </div>

          {/* Respostas recebidas - Compacto */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {orcamentoData.respostasRecebidas}/{orcamentoData.totalSolicitacoes} Respostas
                </p>
                <p className="text-xs text-muted-foreground">Links enviados</p>
              </div>
            </div>
            {orcamentoData.solicitacaoFornecedores ? (
              <div className="flex items-center gap-1.5 text-xs text-success">
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

          {/* Progresso - Compacto */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isDeadlineExpired 
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
              <div className="flex items-center gap-1.5 text-success">
                <CheckCircle className="h-3 w-3" />
                <span>{orcamentoData.itens.length} itens adicionados</span>
              </div>
              <div className="flex items-center gap-1.5 text-success">
                <CheckCircle className="h-3 w-3" />
                <span>{orcamentoData.fontes.length} fontes consultadas</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isDeadlineExpired ? "text-destructive" : "text-info"}`}>
                {isDeadlineExpired ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                <span>{isDeadlineExpired ? "Prazo encerrado" : "Aguardando fornecedores"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== AÇÕES ===== */}
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

        {/* Modal de confirmação com senha */}
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
