import { useRef, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Download, Printer, Building2, User, Calendar, FileText, ArrowLeft, Save, FileEdit } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const defaultRelatorioData = {
  entidade: "Prefeitura Municipal de São Paulo",
  responsavel: "Usuário do Sistema",
  dataRelatorio: new Date().toLocaleDateString('pt-BR'),
  fornecedoresSolicitados: [] as string[],
  fornecedoresResponderam: [] as string[],
  basesComResultados: ["PNCP", "BPS", "CMED", "SINAPI", "SETOP", "CEASA", "BANCO DE NFe"],
  itens: [] as ItemRelatorio[],
};

const formatarBasesConsultadas = (bases: string[]): string => {
  const nomesBases: Record<string, string> = {
    "PNCP": "Portal Nacional de Contratações Públicas (PNCP)",
    "BPS": "Banco de Preços em Saúde (BPS)",
    "Painel de Preços": "Painel de Preços do Governo Federal",
    "NFe": "Notas Fiscais Eletrônicas (NFe)",
    "CATSER": "Catálogo de Serviços (CATSER)",
    "SINAPI": "Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil (SINAPI)",
    "CMED": "Câmara de Regulação do Mercado de Medicamentos (CMED)",
  };

  return bases.map(base => nomesBases[base] || base).join(", ");
};

export default function RelatorioFinal() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { createOrcamento } = useOrcamentos();
  const { profile, entidade } = useAuth();

  const [orcamentoNome, setOrcamentoNome] = useState("");
  const [saveStatus, setSaveStatus] = useState<"draft" | "waiting_suppliers" | "completed">("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  const state = location.state as {
    itens?: any[],
    entidade?: string,
    responsavel?: string,
    fornecedores?: any[],
    nomeOrcamento?: string
  } | undefined;

  useEffect(() => {
    // Set default name suggestion
    if (state?.nomeOrcamento) {
      setOrcamentoNome(state.nomeOrcamento);
    } else if (state?.itens && state.itens.length > 0) {
      setOrcamentoNome(`Orçamento - ${state.itens[0].nome} e outros`);
    } else {
      setOrcamentoNome(`Orçamento - ${new Date().toLocaleDateString()}`);
    }
  }, [state]);

  // Processar dados
  const fornecedoresNomes = state?.fornecedores?.map((f: any) => f.razao_social || f.nome) || [];

  const relatorioData = {
    ...defaultRelatorioData,
    entidade: entidade?.nome || state?.entidade || "Entidade não identificada",
    responsavel: profile?.nome || state?.responsavel || "Responsável não identificado",
    dataRelatorio: new Date().toLocaleDateString('pt-BR'),
    fornecedoresSolicitados: fornecedoresNomes,
    itens: state?.itens ? state.itens.map(item => {
      // Re-cálculo caso não venha pronto
      const valores = item.itensEncontrados?.map((i: any) => i.preco ?? i.valor ?? 0) || [];
      const soma = valores.reduce((a: number, b: number) => a + b, 0);
      const media = valores.length > 0 ? soma / valores.length : (item.media || 0);

      const valoresOrdenados = [...valores].sort((a, b) => a - b);
      const meio = Math.floor(valoresOrdenados.length / 2);
      const mediana = valores.length === 0 ? (item.mediana || 0) : (valoresOrdenados.length % 2 !== 0
        ? valoresOrdenados[meio]
        : (valoresOrdenados[meio - 1] + valoresOrdenados[meio]) / 2);

      return {
        id: item.id || Math.random().toString(),
        nome: item.nome,
        unidade: item.unidade || 'UN',
        quantidade: item.quantidade || 1,
        precos: item.itensEncontrados?.map((i: any) => ({
          fonte: i.fonte || "Desconhecido",
          valor: i.preco ?? i.valor ?? 0
        })) || [],
        media,
        mediana
      };
    }) : defaultRelatorioData.itens
  };

  const executeSave = async (status: "draft" | "waiting_suppliers" | "completed", nome: string) => {
    setIsSaving(true);
    try {
      // Passa os itens brutos do state (não os transformados pelo relatório)
      // O hook aceita: nome, quantidade, unidade, preco, valor, media, valor_referencia
      const itensParaSalvar = state?.itens || [];

      await createOrcamento(
        nome,
        itensParaSalvar,
        state?.fornecedores || [],
        status
      );

      setIsNameDialogOpen(false);
      navigate("/orcamentos");

    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSaveDialog = (status: "draft" | "waiting_suppliers" | "completed") => {
    if (!relatorioData.itens || relatorioData.itens.length === 0) {
      toast.error("Não há itens para salvar neste orçamento.");
      return;
    }

    // Se já temos um nome definido pelo usuário no início do fluxo, salvamos direto
    if (state?.nomeOrcamento) {
      executeSave(status, state.nomeOrcamento);
      return;
    }

    setSaveStatus(status);
    setIsNameDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!orcamentoNome.trim()) {
      toast.error("Por favor, informe um nome para o orçamento.");
      return;
    }
    await executeSave(saveStatus, orcamentoNome);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast.info("Gerando PDF, aguarde...");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Melhor qualidade
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Orcamento_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF.");
    }
  };

  return (
    <MainLayout title="Relatório Final" subtitle="Orçamento consolidado para impressão">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Ações Toolbar */}
        <div className="flex items-center justify-between print:hidden bg-card p-4 rounded-lg border border-border sticky top-4 z-10 shadow-sm">
          <div className="flex bg-muted rounded-md p-1">
            <Link to="/resultado-busca">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleOpenSaveDialog("draft")} disabled={isSaving}>
              <FileEdit className="h-4 w-4" />
              Salvar Rascunho
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              PDF
            </Button>

            <Button size="sm" className="gap-2 ml-2" onClick={() => handleOpenSaveDialog(fornecedoresNomes.length > 0 ? "waiting_suppliers" : "completed")} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {fornecedoresNomes.length > 0 ? "Finalizar e Enviar" : "Finalizar Orçamento"}
            </Button>
          </div>
        </div>

        {/* Relatório Container Ref para PDF */}
        <div ref={reportRef} className="rounded-lg border border-border bg-white text-black p-8 print:border-none print:p-0 shadow-lg">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              Relatório de Pesquisa de Preços
            </h1>
            <p className="text-gray-600">
              Sistema Média Fácil - Captação de Orçamentos
            </p>
          </div>

          {/* Identificação */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Entidade Solicitante</p>
                <p className="font-medium">{relatorioData.entidade}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Responsável</p>
                <p className="font-medium">{relatorioData.responsavel}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Data do Relatório</p>
                <p className="font-medium">{relatorioData.dataRelatorio}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-200" />

          {/* Metodologia */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Metodologia de Pesquisa de Preços</h2>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100 text-justify">
              <p>
                A presente pesquisa de preços foi realizada por meio de consulta às bases públicas e referenciais que apresentaram resultados válidos para o objeto pesquisado, disponíveis no sistema, incluindo, conforme aplicável, {formatarBasesConsultadas(relatorioData.basesComResultados)} e demais tabelas habilitadas.
              </p>
              <p>
                Foram considerados exclusivamente os registros compatíveis com o objeto da contratação, observando-se a similaridade do item, a atualidade das informações e a abrangência geográfica definida pelo usuário, contemplando o período dos últimos 12 (doze) meses, em conformidade com as disposições da Lei nº 14.133/2021.
              </p>
              {relatorioData.fornecedoresSolicitados.length > 0 && (
                <p>
                  De forma complementar, quando aplicável, procedeu-se à solicitação de orçamentos junto a fornecedores do ramo de atividade correspondente, selecionados com base em critérios objetivos previamente estabelecidos no sistema. As solicitações foram encaminhadas aos seguintes fornecedores: <strong>{relatorioData.fornecedoresSolicitados.join(", ")}</strong>.
                  {relatorioData.fornecedoresResponderam.length > 0 && (
                    <> Dentre estes, apresentaram resposta à solicitação os fornecedores: {relatorioData.fornecedoresResponderam.join(", ")}.</>
                  )}
                </p>
              )}
              <p>
                Os valores obtidos, tanto das bases referenciais quanto das cotações recebidas, foram analisados de forma comparativa, com apuração de média e mediana dos preços considerados válidos, com a finalidade de subsidiar a adequada formação do preço de referência, observando-se os princípios da razoabilidade, economicidade e eficiência.
              </p>
            </div>
          </div>

          <Separator className="my-6 bg-gray-200" />

          {/* Tabela de itens */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Itens Pesquisados</h2>

            <div className="space-y-6">
              {relatorioData.itens.map((item) => {
                const totalItem = (item.media || 0) * (item.quantidade || 1);
                return (
                  <div key={item.id} className="rounded-lg border border-gray-300 overflow-hidden break-inside-avoid">
                    {/* Header do item */}
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{item.nome}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantidade} {item.unidade}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase">Média Unitária</p>
                          <p className="font-bold text-gray-900 text-lg">
                            R$ {Number(item.media).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Preços por fonte */}
                    <div className="divide-y divide-gray-200 bg-white">
                      {item.precos.map((preco, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <span className="font-medium text-gray-600">{preco.fonte}</span>
                          <span className="font-semibold text-gray-800">R$ {Number(preco.valor).toFixed(2)}</span>
                        </div>
                      ))}
                      {item.precos.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 italic">
                          Nenhum preço encontrado nas bases consultadas.
                        </div>
                      )}
                    </div>

                    {/* Média, mediana e Total */}
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between text-sm border-t border-gray-200">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-gray-600">Média: </span>
                          <span className="font-bold text-gray-900">R$ {Number(item.media).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Mediana: </span>
                          <span className="font-bold text-gray-900">R$ {Number(item.mediana).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">Total do Item: </span>
                        <span className="font-bold text-emerald-700">R$ {totalItem.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* VALOR TOTAL GERAL DO RELATÓRIO */}
              <div className="mt-8 p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-900">Valor Total Estimado</h3>
                  <p className="text-sm text-emerald-700">Soma de todos os itens considerando a média unitária</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-900">
                    R$ {relatorioData.itens.reduce((acc, item) => acc + (item.media * item.quantidade), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-200" />

          {/* Rodapé do relatório */}
          <div className="text-center text-xs text-gray-400 mt-12 pb-4">
            <p>Documento gerado digitalmente pelo Sistema Média Fácil - Integridade verificável</p>
            <p className="mt-1">{relatorioData.dataRelatorio} • {relatorioData.entidade}</p>
          </div>
        </div>
      </div>

      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nome do Orçamento</DialogTitle>
            <DialogDescription>
              Informe um nome que identifique claramente o contexto deste orçamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Orçamento</Label>
              <Input
                id="name"
                value={orcamentoNome}
                onChange={(e) => setOrcamentoNome(e.target.value)}
                placeholder="Ex: Equipamentos de TI - Secretaria X"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Confirmar e Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
