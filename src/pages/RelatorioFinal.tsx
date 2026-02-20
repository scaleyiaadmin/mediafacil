import { useRef, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Download, Printer, Building2, User, Calendar, FileText, ArrowLeft, Save, FileEdit } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { supabase } from "@/lib/supabase";
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
  basesComResultados: ["PNCP", "BPS", "Painel de Preços", "NFe", "CATSER", "SINAPI", "CMED"],
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

  const [responsavelName, setResponsavelName] = useState(defaultRelatorioData.responsavel);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [orcamentoNome, setOrcamentoNome] = useState("");
  const [saveStatus, setSaveStatus] = useState<"draft" | "waiting_suppliers" | "completed">("draft");

  const state = location.state as {
    itens?: any[],
    entidade?: string,
    responsavel?: string,
    fornecedores?: any[],
    nomeOrcamento?: string
  } | undefined;

  useEffect(() => {
    async function getUserParam() {
      const { data: { user } } = await supabase.auth.getUser();

      let foundName = null;

      if (user?.email) {
        // Try to find in public.usuarios
        const { data: publicUser } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('email', user.email)
          .single();

        if (publicUser?.nome) {
          foundName = publicUser.nome;
        } else if (user.user_metadata?.nome) {
          foundName = user.user_metadata.nome;
        } else {
          // Fallback to email username
          foundName = user.email.split('@')[0];
        }
      }

      if (foundName) {
        setResponsavelName(foundName);
      } else if (state?.responsavel) {
        setResponsavelName(state.responsavel);
      }
    }
    getUserParam();

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
    entidade: state?.entidade || defaultRelatorioData.entidade,
    responsavel: responsavelName,
    dataRelatorio: new Date().toLocaleDateString('pt-BR'),
    fornecedoresSolicitados: fornecedoresNomes,
    itens: state?.itens ? state.itens.map(item => {
      // Re-cálculo caso não venha pronto
      const valores = item.itensEncontrados?.map((i: any) => i.valor) || [];
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
          valor: i.valor
        })) || [],
        media,
        mediana
      };
    }) : defaultRelatorioData.itens
  };

  const executeSave = async (status: "draft" | "waiting_suppliers" | "completed", nome: string) => {
    setIsSaving(true);
    try {
      await createOrcamento(
        nome,
        relatorioData.itens,
        state?.fornecedores || [],
        status
      );

      setIsNameDialogOpen(false);
      navigate("/");

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
            <Button variant="outline" size="sm" className="gap-2 px-4 h-9 border-slate-200" onClick={() => handleOpenSaveDialog("draft")} disabled={isSaving}>
              <FileEdit className="h-4 w-4" />
              Salvar Rascunho
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="sm" className="gap-2 text-slate-500" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              PDF
            </Button>

            <Button size="sm" className="gap-2 ml-2 bg-[#D84B16] hover:bg-[#BF4213] text-white font-bold h-9 px-5" onClick={() => handleOpenSaveDialog(fornecedoresNomes.length > 0 ? "waiting_suppliers" : "completed")} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {fornecedoresNomes.length > 0 ? "Finalizar e Enviar" : "Finalizar Orçamento"}
            </Button>
          </div>
        </div>

        {/* Relatório Container Ref para PDF */}
        <div ref={reportRef} className="rounded-xl border border-border bg-white text-black p-12 print:border-none print:p-0 shadow-xl min-h-[1100px]">
          {/* Cabeçalho Metodológico */}
          <div className="mb-12 text-justify text-[13px] leading-relaxed text-slate-700 space-y-5 max-w-3xl">
            <p>
              Os valores obtidos, tanto das bases referenciais quanto das cotações recebidas, foram analisados de forma comparativa, com apuração de média e mediana dos preços considerados válidos, com a finalidade de subsidiar a adequada formação do preço de referência, observando-se os princípios da razoabilidade, economicidade e eficiência.
            </p>
            <p>
              A presente pesquisa de preços integra o processo administrativo e tem por finalidade subsidiar a tomada de decisão da Administração, não se caracterizando como proposta comercial.
            </p>
          </div>

          {/* Seção de Itens Pesquisados */}
          <div className="space-y-12">
            <h2 className="text-xl font-black text-slate-900 border-b-2 border-slate-900 pb-2 inline-block mb-8 uppercase tracking-tight">
              Itens Pesquisados
            </h2>

            <div className="space-y-12">
              {relatorioData.itens.map((item) => (
                <div key={item.id} className="break-inside-avoid border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  {/* Item Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{item.nome}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {item.quantidade} {item.unidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Média</p>
                      <p className="text-2xl font-black text-[#D84B16] tabular-nums">
                        R$ {Number(item.media).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Fontes de Preço */}
                  <div className="space-y-0.5">
                    {item.precos.map((preco, index) => (
                      <div key={index} className="flex justify-between py-2 text-sm">
                        <span className="font-bold text-slate-400 uppercase tracking-tight">{preco.fonte}</span>
                        <span className="font-black text-slate-800 tabular-nums">
                          R$ {Number(preco.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {item.precos.length === 0 && (
                      <p className="py-4 text-sm italic text-slate-300">Nenhum preço de referência encontrado nas bases consultadas.</p>
                    )}
                  </div>

                  {/* Footer do Item com Média e Mediana */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50 text-[13px] font-black uppercase tracking-tight text-slate-800">
                    <div>
                      Média: <span className="text-[#D84B16]">R$ {Number(item.media).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-slate-400">
                      Mediana: <span className="text-slate-800">R$ {Number(item.mediana).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé do Documento */}
          <div className="mt-24 pt-10 border-t border-slate-100 text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Documento gerado pelo Sistema Média Fácil
            </p>
            <p className="text-[10px] font-bold text-slate-300">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Orçamento</DialogTitle>
            <DialogDescription>
              Dê um nome para este orçamento para salvá-lo em sua lista.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="orcamento-nome" className="text-xs font-bold uppercase text-slate-500 mb-2 block">
              Nome do Orçamento
            </Label>
            <Input
              id="orcamento-nome"
              value={orcamentoNome}
              onChange={(e) => setOrcamentoNome(e.target.value)}
              placeholder="Ex: Materiais de Escritório 2026"
              className="h-11"
            />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsNameDialogOpen(false)} className="font-bold">
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave} disabled={isSaving} className="bg-[#D84B16] hover:bg-[#BF4213] text-white font-bold h-10 px-6">
              {isSaving ? "Salvando..." : "Salvar e Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
