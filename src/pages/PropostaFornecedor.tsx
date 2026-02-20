import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building2,
  Phone,
  Mail,
  User,
  FileText,
  Save,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
} from "lucide-react";
import logo from "@/assets/logo.png";

// Types
interface ItemCotacao {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  marca: string;
  valorUnitario: number;
}

interface DadosFornecedor {
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
}

interface DadosSolicitante {
  nomeEntidade: string;
  telefone: string;
  email: string;
  responsavel: string;
  emailResponsavel: string;
}

interface DadosResponsavelEnvio {
  nome: string;
  cpf: string;
  telefone: string;
}

type StatusProposta = "preenchimento" | "salvo" | "enviado" | "expirado";

// Mock data - em produção virá do backend
const mockSolicitacao = {
  id: "SOL-2024-001",
  dataEnvio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
  prazoEmDias: 10,
  solicitante: {
    nomeEntidade: "Prefeitura Municipal de João Monlevade",
    telefone: "(31) 3851-1234",
    email: "compras@joaomonlevade.mg.gov.br",
    responsavel: "Maria Silva",
    emailResponsavel: "maria.silva@joaomonlevade.mg.gov.br",
  } as DadosSolicitante,
  fornecedor: {
    razaoSocial: "Distribuidora Central Ltda",
    cnpj: "12.345.678/0001-90",
    endereco: "Rua das Flores, 123",
    cidade: "Belo Horizonte",
    uf: "MG",
    cep: "30130-000",
  } as DadosFornecedor,
  itens: [
    { id: "1", descricao: "Papel A4 75g/m² - Pacote com 500 folhas", unidade: "Pacote", quantidade: 100, marca: "", valorUnitario: 0 },
    { id: "2", descricao: "Caneta esferográfica azul", unidade: "Caixa c/50", quantidade: 20, marca: "", valorUnitario: 0 },
    { id: "3", descricao: "Grampeador de mesa médio", unidade: "Unidade", quantidade: 15, marca: "", valorUnitario: 0 },
    { id: "4", descricao: "Clips niquelado 2/0", unidade: "Caixa c/500", quantidade: 30, marca: "", valorUnitario: 0 },
    { id: "5", descricao: "Envelope ofício branco 114x229mm", unidade: "Pacote c/100", quantidade: 25, marca: "", valorUnitario: 0 },
  ] as ItemCotacao[],
};

// Helpers
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
};

export default function PropostaFornecedor() {
  const { token } = useParams<{ token: string }>();

  // State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [itens, setItens] = useState<ItemCotacao[]>([]);
  const [status, setStatus] = useState<StatusProposta>("preenchimento");
  const [cnpjConfirmacao, setCnpjConfirmacao] = useState("");
  const [cnpjDiferente, setCnpjDiferente] = useState(false);
  const [responsavelEnvio, setResponsavelEnvio] = useState<DadosResponsavelEnvio>({
    nome: "",
    cpf: "",
    telefone: "",
  });
  const [dataEnvio, setDataEnvio] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [observacoes, setObservacoes] = useState("");
  const [declinedReason, setDeclinedReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load live data from Supabase
  useEffect(() => {
    async function loadProposta() {
      if (!token) return;

      try {
        setLoading(true);
        // 1. Fetch the relation
        const { data: rel, error: relError } = await supabase
          .from('orcamento_fornecedores')
          .select(`
            *,
            orcamentos (*, entidades (*), usuarios (*)),
            fornecedores (*)
          `)
          .eq('token', token)
          .single();

        if (relError) throw relError;
        setSolicitacao(rel);

        // 2. Fetch the items
        const { data: items, error: itemsError } = await supabase
          .from('orcamento_itens')
          .select('*')
          .eq('orcamento_id', rel.orcamento_id);

        if (itemsError) throw itemsError;

        // 3. Map items and check for existing responses
        const mappedItens = items.map(item => ({
          id: item.id,
          descricao: item.nome + (item.descricao ? ` - ${item.descricao}` : ''),
          unidade: item.unidade,
          quantidade: item.quantidade,
          marca: "",
          valorUnitario: 0
        }));

        setItens(mappedItens);

        if (rel.status === 'replied') {
          setStatus('enviado');
          setDataEnvio(new Date(rel.data_resposta));
        } else if (rel.status === 'declined') {
          setStatus('enviado');
        }

      } catch (error) {
        console.error("Error loading proposal:", error);
        toast.error("Link de proposta inválido ou expirado.");
      } finally {
        setLoading(false);
      }
    }
    loadProposta();
  }, [token]);

  // Prazo calc
  const dataLimite = useMemo(() => {
    if (!solicitacao) return new Date();
    const limite = new Date(solicitacao.created_at);
    limite.setDate(limite.getDate() + 10);
    return limite;
  }, [solicitacao]);

  const prazoExpirado = useMemo(() => {
    return new Date() > dataLimite;
  }, [dataLimite]);

  const diasRestantes = useMemo(() => {
    const diff = dataLimite.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [dataLimite]);

  useEffect(() => {
    if (prazoExpirado && status !== "enviado") {
      setStatus("expirado");
    }
  }, [prazoExpirado, status]);

  const totalGeral = useMemo(() => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
  }, [itens]);

  // Handlers
  const handleItemChange = (id: string, field: "marca" | "valorUnitario", value: string | number) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDecline = async () => {
    if (!declinedReason.trim()) {
      toast.error("Por favor, informe o motivo do declínio.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('orcamento_fornecedores')
        .update({
          status: 'declined',
          observacoes: `DECLINADO: ${declinedReason}`,
          data_resposta: new Date().toISOString()
        })
        .eq('id', solicitacao.id);

      if (error) throw error;

      await supabase.from('notificacoes').insert({
        entidade_id: solicitacao.orcamentos.entidade_id,
        titulo: "Cotação Declinada",
        mensagem: `${solicitacao.fornecedores.razao_social} declinou da cotação "${solicitacao.orcamentos.nome}". Motivo: ${declinedReason}`,
        link: `/orcamento/${solicitacao.orcamento_id}`
      });

      setStatus("enviado");
      setShowDeclineDialog(false);
      toast.success("Resposta enviada. Obrigado!");
    } catch (error: any) {
      toast.error("Erro ao processar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!solicitacao) return;

    try {
      setLoading(true);
      const now = new Date();

      const responsesToInsert = itens.map(item => ({
        orcamento_fornecedor_id: solicitacao.id,
        orcamento_item_id: item.id,
        marca: item.marca,
        valor_unitario: item.valorUnitario
      }));

      const { error: resError } = await supabase
        .from('respostas_itens')
        .insert(responsesToInsert);

      if (resError) throw resError;

      const { error: updError } = await supabase
        .from('orcamento_fornecedores')
        .update({
          status: 'replied',
          data_resposta: now.toISOString(),
          observacoes: observacoes
        })
        .eq('id', solicitacao.id);

      if (updError) throw updError;

      await supabase.from('notificacoes').insert({
        entidade_id: solicitacao.orcamentos.entidade_id,
        titulo: "Novo Orçamento Recebido",
        mensagem: `${solicitacao.fornecedores.razao_social} respondeu à cotação "${solicitacao.orcamentos.nome}".`,
        link: `/orcamento/${solicitacao.orcamento_id}`
      });

      setDataEnvio(now);
      setStatus("enviado");
      setShowConfirmModal(false);
      toast.success("Orçamento enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar proposta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Steps navigation logic
  const nextStep = () => {
    if (currentStep === 2) {
      const incompleto = itens.some(i => !i.marca || i.valorUnitario <= 0);
      if (incompleto) {
        toast.warning("Atenção", {
          description: "Alguns itens estão sem marca ou valor. Deseja continuar?",
          action: {
            label: "Continuar",
            onClick: () => setCurrentStep(prev => prev + 1)
          }
        });
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  if (loading && !solicitacao) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render: Prazo expirado
  if (status === "expirado") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-t-4 border-t-destructive shadow-xl">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive font-black">Prazo Encerrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-500 font-medium">
              O prazo limite para envio desta cotação expirou em{" "}
              <strong className="text-slate-900">{formatDate(dataLimite)}</strong>.
            </p>
            <Separator />
            <div className="text-sm text-left bg-slate-50 p-6 rounded-2xl space-y-2 border border-slate-100">
              <p className="font-bold text-slate-800 tracking-tight">{solicitacao?.orcamentos?.entidades?.nome}</p>
              <p className="text-slate-500">{solicitacao?.orcamentos?.entidades?.telefone}</p>
              <p className="text-slate-500">{solicitacao?.orcamentos?.entidades?.email}</p>
            </div>
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => window.close()}>
              Fechar Página
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render: Finalized/Replied or Declined
  if (status === "enviado") {
    const isDeclined = solicitacao?.status === 'declined' || solicitacao?.observacoes?.startsWith('DECLINADO');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pt-12">
            <div className="flex justify-center mb-8">
              {isDeclined ? (
                <div className="bg-amber-100 p-6 rounded-full animate-in zoom-in duration-500">
                  <Clock className="h-16 w-16 text-amber-600" />
                </div>
              ) : (
                <div className="bg-green-100 p-6 rounded-full animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              )}
            </div>
            <CardTitle className={`text-3xl font-black tracking-tight ${isDeclined ? 'text-amber-700' : 'text-green-700'}`}>
              {isDeclined ? 'Resposta Enviada' : 'Proposta Protocolada!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pb-12 px-10">
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              {isDeclined
                ? "Sua decisão de não participar desta cotação foi registrada com sucesso. Agradecemos o seu retorno."
                : "Recebemos sua cotação de preços. O protocolo foi gerado e a entidade solicitante já foi notificada."}
            </p>

            {!isDeclined && (
              <div className="bg-primary/5 border-2 border-primary/5 rounded-3xl p-8 transition-all hover:scale-105">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Valor da sua proposta:</p>
                <p className="font-black text-4xl text-primary">{formatCurrency(totalGeral)}</p>
              </div>
            )}

            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
              Enviado em {formatDateTime(dataEnvio || new Date())}
            </div>

            <Button variant="outline" className="w-full h-14 rounded-2xl font-bold text-slate-600 border-2 hover:bg-slate-50 transition-all" onClick={() => window.close()}>
              Encerrar Sessão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Step Indicator Header - Minimalist */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Proposta Digital</span>
          </div>

          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${currentStep === step ? 'bg-primary text-white' :
                    currentStep > step ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {currentStep > step ? <Check className="h-3 w-3" /> : step}
                </div>
                {step < 3 && <div className="w-4 h-[2px] bg-slate-100 rounded-full" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* STEP 1: Identification + Items Overview */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Olá, {solicitacao?.fornecedores?.razao_social?.split(' ')[0] || 'Fornecedor'}</h2>
              <p className="text-slate-500 text-sm">Você recebeu uma solicitação de cotação da <strong>{solicitacao?.orcamentos?.entidades?.nome}</strong>.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Itens Solicitados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold uppercase py-2">Descrição</TableHead>
                        <TableHead className="text-center text-[10px] font-bold uppercase py-2">Qtd</TableHead>
                        <TableHead className="text-center text-[10px] font-bold uppercase py-2">Unidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id} className="h-12">
                          <TableCell className="text-xs font-medium text-slate-700">{item.descricao}</TableCell>
                          <TableCell className="text-center text-xs font-bold text-primary">{item.quantidade}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 h-5 bg-slate-50 border-slate-200">{item.unidade}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-slate-200/60 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-sm font-bold">Prazo Limite</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <Clock className="h-4 w-4" />
                      <div>
                        <p className="text-xs font-bold">{formatDate(dataLimite)}</p>
                        <p className="text-[10px] font-medium opacity-80">{diasRestantes} dias restantes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                  <Button onClick={nextStep} className="w-full h-11 text-xs font-bold group">
                    Participar da Cotação
                    <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeclineDialog(true)} className="w-full h-11 text-xs font-bold text-slate-500 border-slate-200">
                    Não tenho interesse
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Compact Quotation Table */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Preencher Cotação</h2>
                <p className="text-sm text-slate-400 font-medium">Insira os valores unitários e marcas dos itens.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estimado</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(totalGeral)}</p>
              </div>
            </div>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase py-3 px-6">Item</TableHead>
                      <TableHead className="w-[180px] text-[10px] font-bold uppercase py-3">Marca/Modelo</TableHead>
                      <TableHead className="w-[150px] text-[10px] font-bold uppercase py-3">Valor Unit.</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase py-3 px-6">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id} className="h-16 group hover:bg-slate-50/30 transition-colors">
                        <TableCell className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700">{item.descricao}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.quantidade} {item.unidade}</p>
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            placeholder="Marca"
                            value={item.marca}
                            onChange={(e) => handleItemChange(item.id, "marca", e.target.value)}
                            className="h-9 text-xs border-slate-200 focus:border-primary/50 transition-all rounded-md"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">R$</span>
                            <Input
                              type="number"
                              placeholder="0,00"
                              value={item.valorUnitario || ""}
                              onChange={(e) => handleItemChange(item.id, "valorUnitario", parseFloat(e.target.value) || 0)}
                              className="h-9 pl-8 text-xs font-bold border-slate-200 focus:border-primary/50 transition-all rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 font-bold text-slate-900 text-xs">
                          {formatCurrency(item.quantidade * item.valorUnitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <Button variant="ghost" onClick={prevStep} className="text-slate-400 text-xs font-bold h-10 px-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button onClick={nextStep} className="h-10 px-6 font-bold text-xs">
                Revisar e Finalizar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Unified Review & Finalization */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Revisão Final</h2>
              <p className="text-slate-500 text-sm font-medium">Complete os dados para protocolar sua proposta.</p>
            </div>

            <Card className="border-slate-200/60 shadow-md">
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center rounded-t-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Total da Proposta</p>
                  <p className="text-3xl font-black">{formatCurrency(totalGeral)}</p>
                </div>
                <div className="text-right opacity-60">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Itens</p>
                  <p className="font-bold text-sm">{itens.filter(i => i.valorUnitario > 0).length} de {itens.length}</p>
                </div>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observações (Opcional)</Label>
                  <textarea
                    className="w-full h-24 p-4 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary/50 outline-none resize-none transition-all bg-slate-50/30"
                    placeholder="Validade do orçamento, prazos de entrega, etc..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Responsável *</Label>
                    <Input
                      value={responsavelEnvio.nome}
                      onChange={(e) => setResponsavelEnvio(p => ({ ...p, nome: e.target.value }))}
                      placeholder="Seu Nome"
                      className="h-10 text-xs font-medium border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CNPJ Empresa *</Label>
                    <Input
                      value={cnpjConfirmacao}
                      onChange={(e) => {
                        const f = formatCNPJ(e.target.value);
                        setCnpjConfirmacao(f);
                        setCnpjDiferente(f.replace(/\D/g, "") !== solicitacao?.fornecedores?.cnpj?.replace(/\D/g, ""));
                      }}
                      placeholder="00.000.000/0000-00"
                      className="h-10 text-xs font-medium border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seu CPF *</Label>
                    <Input
                      value={responsavelEnvio.cpf}
                      onChange={(e) => setResponsavelEnvio(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                      placeholder="000.000.000-00"
                      className="h-10 text-xs font-medium border-slate-200"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp *</Label>
                    <Input
                      value={responsavelEnvio.telefone}
                      onChange={(e) => setResponsavelEnvio(p => ({ ...p, telefone: formatPhone(e.target.value) }))}
                      placeholder="(00) 00000-0000"
                      className="h-10 text-xs font-medium border-slate-200"
                      maxLength={15}
                    />
                  </div>
                </div>

                {cnpjDiferente && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-700 font-bold flex gap-3 italic">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    O CNPJ informado é diferente do cadastrado inicialmente.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-4">
              <Button variant="ghost" onClick={prevStep} className="text-slate-400 text-xs font-bold h-10 px-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Editar Itens
              </Button>
              <Button
                size="lg"
                onClick={() => setShowConfirmModal(true)}
                disabled={!responsavelEnvio.nome || responsavelEnvio.cpf.length < 14 || !cnpjConfirmacao}
                className="h-12 px-8 rounded-xl font-bold text-xs bg-primary hover:bg-slate-900 shadow-lg shadow-primary/20 transition-all flex gap-3 items-center group"
              >
                PROTOCOLAR AGORA
                <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {showConfirmModal && (
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-md rounded-2xl p-0 border-0 shadow-2xl overflow-hidden bg-white">
            <div className="h-1 bg-primary w-full"></div>
            <div className="p-8">
              <DialogHeader>
                <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Send className="h-7 w-7 text-primary" />
                </div>
                <DialogTitle className="text-xl font-bold text-center">Confirmar Envio?</DialogTitle>
                <DialogDescription className="text-center text-slate-500 text-sm py-4">
                  Sua proposta de <strong className="text-slate-900">{formatCurrency(totalGeral)}</strong> será enviada para <strong>{solicitacao?.orcamentos?.entidades?.nome}</strong>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col gap-3 sm:flex-row mt-4">
                <Button variant="ghost" className="flex-1 h-11 rounded-xl font-bold text-slate-400" onClick={() => setShowConfirmModal(false)}>Ajustar</Button>
                <Button className="flex-1 h-11 rounded-xl font-bold bg-primary text-white" onClick={handleConfirmSubmit}>Confirmar</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showDeclineDialog && (
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent className="sm:max-w-md rounded-2xl p-0 border-0 shadow-2xl overflow-hidden bg-white">
            <div className="h-1 bg-amber-400 w-full"></div>
            <div className="p-8">
              <DialogHeader>
                <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-7 w-7 text-amber-600" />
                </div>
                <DialogTitle className="text-xl font-bold text-center text-amber-900">Declinar Convite</DialogTitle>
                <DialogDescription className="text-center text-slate-500 text-sm py-2">
                  Por favor, informe o motivo do declínio para que possamos melhorar nossa comunicação futuramento.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <textarea
                  className="w-full h-28 p-4 border border-slate-200 rounded-xl outline-none focus:border-amber-200 bg-slate-50/30 transition-all resize-none text-sm font-medium text-slate-700"
                  placeholder="Ex: Não trabalhamos com esta marca..."
                  value={declinedReason}
                  onChange={(e) => setDeclinedReason(e.target.value)}
                />
              </div>
              <DialogFooter className="flex flex-col gap-3 sm:flex-row mt-4">
                <Button variant="ghost" className="flex-1 h-11 rounded-xl font-bold text-slate-400" onClick={() => setShowDeclineDialog(false)}>Cancelar</Button>
                <Button variant="destructive" className="flex-1 h-11 rounded-xl font-bold" onClick={handleDecline}>Confirmar Declínio</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
