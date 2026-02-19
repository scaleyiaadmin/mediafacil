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
  const [itens, setItens] = useState<ItemCotacao[]>(mockSolicitacao.itens);
  const [status, setStatus] = useState<StatusProposta>("preenchimento");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cnpjConfirmacao, setCnpjConfirmacao] = useState("");
  const [cnpjDiferente, setCnpjDiferente] = useState(false);
  const [responsavelEnvio, setResponsavelEnvio] = useState<DadosResponsavelEnvio>({
    nome: "",
    cpf: "",
    telefone: "",
  });
  const [dataEnvio, setDataEnvio] = useState<Date | null>(null);

  // Cálculos de prazo
  const dataLimite = useMemo(() => {
    const limite = new Date(mockSolicitacao.dataEnvio);
    limite.setDate(limite.getDate() + mockSolicitacao.prazoEmDias);
    return limite;
  }, []);

  const prazoExpirado = useMemo(() => {
    return new Date() > dataLimite;
  }, [dataLimite]);

  const diasRestantes = useMemo(() => {
    const diff = dataLimite.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [dataLimite]);

  // Verificar se prazo expirou
  useEffect(() => {
    if (prazoExpirado && status !== "enviado") {
      setStatus("expirado");
    }
  }, [prazoExpirado, status]);

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`proposta-${token}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setItens(parsed.itens);
      if (parsed.status === "enviado") {
        setStatus("enviado");
        setDataEnvio(new Date(parsed.dataEnvio));
      } else if (parsed.itens.some((i: ItemCotacao) => i.marca || i.valorUnitario > 0)) {
        setStatus("salvo");
      }
    }
  }, [token]);

  // Cálculo do total geral
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
    if (status === "salvo") {
      setStatus("preenchimento");
    }
  };

  const handleSave = () => {
    localStorage.setItem(`proposta-${token}`, JSON.stringify({ itens, status: "salvo" }));
    setStatus("salvo");
    toast.success("Dados salvos com sucesso!", {
      description: "Você pode fechar e retornar a qualquer momento.",
    });
  };

  const handleOpenConfirmModal = () => {
    // Validar se todos os campos estão preenchidos
    const itensIncompletos = itens.filter(
      (item) => !item.marca || item.valorUnitario <= 0
    );
    
    if (itensIncompletos.length > 0) {
      toast.error("Preencha todos os campos", {
        description: `${itensIncompletos.length} item(ns) sem marca ou valor unitário.`,
      });
      return;
    }
    
    setCnpjConfirmacao("");
    setCnpjDiferente(false);
    setResponsavelEnvio({ nome: "", cpf: "", telefone: "" });
    setShowConfirmModal(true);
  };

  const handleCnpjConfirmacao = (value: string) => {
    const formatted = formatCNPJ(value);
    setCnpjConfirmacao(formatted);
    
    // Comparar apenas números
    const cnpjNumeros = formatted.replace(/\D/g, "");
    const cnpjOriginalNumeros = mockSolicitacao.fornecedor.cnpj.replace(/\D/g, "");
    
    setCnpjDiferente(cnpjNumeros.length === 14 && cnpjNumeros !== cnpjOriginalNumeros);
  };

  const canSubmit = useMemo(() => {
    const cnpjNumeros = cnpjConfirmacao.replace(/\D/g, "");
    const cpfNumeros = responsavelEnvio.cpf.replace(/\D/g, "");
    const telefoneNumeros = responsavelEnvio.telefone.replace(/\D/g, "");
    
    return (
      cnpjNumeros.length === 14 &&
      responsavelEnvio.nome.trim().length >= 3 &&
      cpfNumeros.length === 11 &&
      telefoneNumeros.length >= 10
    );
  }, [cnpjConfirmacao, responsavelEnvio]);

  const handleConfirmSubmit = () => {
    const now = new Date();
    localStorage.setItem(
      `proposta-${token}`,
      JSON.stringify({ itens, status: "enviado", dataEnvio: now.toISOString(), responsavel: responsavelEnvio })
    );
    setDataEnvio(now);
    setStatus("enviado");
    setShowConfirmModal(false);
    toast.success("Orçamento enviado com sucesso!");
  };

  // Render: Prazo expirado
  if (status === "expirado") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <img src={logo} alt="Média Fácil" className="h-12 mx-auto mb-4" />
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Prazo Encerrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              O prazo para envio desta cotação expirou em{" "}
              <strong>{formatDate(dataLimite)}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Para mais informações, entre em contato com a prefeitura solicitante:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium">{mockSolicitacao.solicitante.nomeEntidade}</p>
              <p className="text-muted-foreground">{mockSolicitacao.solicitante.telefone}</p>
              <p className="text-muted-foreground">{mockSolicitacao.solicitante.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render: Proposta enviada
  if (status === "enviado" && dataEnvio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <img src={logo} alt="Média Fácil" className="h-12 mx-auto mb-4" />
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-700">Orçamento Enviado com Sucesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Data e hora do envio:</p>
              <p className="font-semibold text-lg">{formatDateTime(dataEnvio)}</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Total Geral da Proposta:</p>
              <p className="font-bold text-2xl text-primary">{formatCurrency(totalGeral)}</p>
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground space-y-2">
              <p>Proposta enviada para:</p>
              <p className="font-medium text-foreground">{mockSolicitacao.solicitante.nomeEntidade}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Esta proposta não poderá mais ser editada. Caso necessite fazer alterações, 
              entre em contato com a prefeitura solicitante.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render: Formulário de preenchimento
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Média Fácil" className="h-10" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Cotação de Preços</h1>
                <p className="text-sm text-muted-foreground">Proposta Digital</p>
              </div>
            </div>
            <Badge
              variant={status === "salvo" ? "default" : "secondary"}
              className={`text-sm px-3 py-1 ${
                status === "salvo" 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
              }`}
            >
              {status === "salvo" ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Salvo</>
              ) : (
                <><Clock className="h-3.5 w-3.5 mr-1" /> Em preenchimento</>
              )}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Prazo de validade */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">
                  Esta solicitação é válida por 10 (dez) dias corridos a partir da data de envio.
                </span>
              </div>
              <div className="text-sm text-amber-700 space-y-1 sm:text-right">
                <p>Enviado em: <strong>{formatDate(mockSolicitacao.dataEnvio)}</strong></p>
                <p>Prazo limite: <strong>{formatDate(dataLimite)}</strong></p>
                <p className="text-amber-900 font-semibold">
                  {diasRestantes} dia(s) restante(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solicitante */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-foreground">{mockSolicitacao.solicitante.nomeEntidade}</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {mockSolicitacao.solicitante.telefone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {mockSolicitacao.solicitante.email}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responsável pela solicitação:</p>
              <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-primary" />
                {mockSolicitacao.solicitante.responsavel}
              </p>
              {mockSolicitacao.solicitante.emailResponsavel && (
                <p className="text-sm text-muted-foreground ml-6">
                  {mockSolicitacao.solicitante.emailResponsavel}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Fornecedor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Dados do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Razão Social:</p>
                <p className="font-medium">{mockSolicitacao.fornecedor.razaoSocial}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CNPJ:</p>
                <p className="font-medium">{mockSolicitacao.fornecedor.cnpj}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Endereço:</p>
                <p className="font-medium">
                  {mockSolicitacao.fornecedor.endereco}, {mockSolicitacao.fornecedor.cidade} - {mockSolicitacao.fornecedor.uf}, CEP {mockSolicitacao.fornecedor.cep}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Itens para Cotação</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="text-center w-24">Unidade</TableHead>
                    <TableHead className="text-center w-20">Qtd.</TableHead>
                    <TableHead className="w-32">Marca</TableHead>
                    <TableHead className="w-36">Valor Unit. (R$)</TableHead>
                    <TableHead className="text-right w-32">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal">
                          {item.unidade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-primary">
                        {item.quantidade}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.marca}
                          onChange={(e) => handleItemChange(item.id, "marca", e.target.value)}
                          placeholder="Marca"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.valorUnitario || ""}
                          onChange={(e) =>
                            handleItemChange(item.id, "valorUnitario", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0,00"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.quantidade * item.valorUnitario)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold text-base">
                      Total Geral da Proposta:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary">
                      {formatCurrency(totalGeral)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Declaração de Finalidade */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900">
              Declaração de Finalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 leading-relaxed">
              A presente solicitação tem como finalidade exclusiva a pesquisa de preços de mercado, 
              para subsidiar eventual instrução de processo administrativo e/ou futura contratação pública, 
              não constituindo pedido de fornecimento, ordem de compra, contrato ou garantia de contratação, 
              sendo utilizada apenas como referência para formação de preço estimado, conforme a legislação aplicável.
            </p>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
          <Button variant="outline" size="lg" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar orçamento
          </Button>
          <Button size="lg" onClick={handleOpenConfirmModal} className="gap-2">
            <Send className="h-4 w-4" />
            Enviar orçamento para a Prefeitura
          </Button>
        </div>
      </main>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Envio do Orçamento</DialogTitle>
            <DialogDescription>
              Por favor, confirme os dados abaixo antes de enviar a proposta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Confirmação de CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj-confirmacao">Confirme o CNPJ da empresa *</Label>
              <Input
                id="cnpj-confirmacao"
                value={cnpjConfirmacao}
                onChange={(e) => handleCnpjConfirmacao(e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {cnpjDiferente && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  O CNPJ informado é diferente do cadastro inicial. Ao confirmar, os dados da proposta serão atualizados para este CNPJ.
                </div>
              )}
            </div>

            <Separator />

            {/* Dados do Responsável */}
            <div className="space-y-4">
              <p className="text-sm font-medium">Dados do Responsável pela Proposta *</p>
              
              <div className="space-y-2">
                <Label htmlFor="nome-responsavel">Nome completo</Label>
                <Input
                  id="nome-responsavel"
                  value={responsavelEnvio.nome}
                  onChange={(e) =>
                    setResponsavelEnvio((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf-responsavel">CPF</Label>
                <Input
                  id="cpf-responsavel"
                  value={responsavelEnvio.cpf}
                  onChange={(e) =>
                    setResponsavelEnvio((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))
                  }
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone-responsavel">Telefone</Label>
                <Input
                  id="telefone-responsavel"
                  value={responsavelEnvio.telefone}
                  onChange={(e) =>
                    setResponsavelEnvio((prev) => ({ ...prev, telefone: formatPhone(e.target.value) }))
                  }
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={!canSubmit} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
