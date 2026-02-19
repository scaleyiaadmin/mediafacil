import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Truck, MoreVertical, Edit, Power, MapPin, Tags, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PasswordConfirmDialog } from "@/components/PasswordConfirmDialog";
import { regioesPorUF } from "@/data/regioes";

interface Fornecedor {
  id: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  cidade: string;
  uf: string;
  regiao: string;
  segmentos: string[];
  status: "ativo" | "inativo";
  cotacoesRecebidas: number;
  taxaResposta: number;
}

interface Segmento {
  id: string;
  nome: string;
  fornecedoresVinculados: number;
}

const fornecedoresData: Fornecedor[] = [
  { id: "1", razaoSocial: "Papelaria Central Ltda", cnpj: "12.345.678/0001-90", email: "contato@papelariacentral.com.br", cidade: "São Paulo", uf: "SP", regiao: "Grande São Paulo", segmentos: ["Papelaria", "Material de Escritório"], status: "ativo", cotacoesRecebidas: 156, taxaResposta: 85 },
  { id: "2", razaoSocial: "Tech Solutions S.A.", cnpj: "23.456.789/0001-01", email: "vendas@techsolutions.com.br", cidade: "Campinas", uf: "SP", regiao: "Campinas e Região", segmentos: ["Informática", "Equipamentos"], status: "ativo", cotacoesRecebidas: 89, taxaResposta: 72 },
  { id: "3", razaoSocial: "Medicamentos Brasil Distribuidora", cnpj: "34.567.890/0001-12", email: "comercial@medbrasil.com.br", cidade: "Rio de Janeiro", uf: "RJ", regiao: "Grande Rio", segmentos: ["Medicamentos", "Saúde"], status: "ativo", cotacoesRecebidas: 234, taxaResposta: 91 },
  { id: "4", razaoSocial: "Móveis Escolares ME", cnpj: "45.678.901/0001-23", email: "vendas@moveisescolares.com.br", cidade: "Belo Horizonte", uf: "MG", regiao: "Grande BH", segmentos: ["Mobiliário", "Equipamentos Escolares"], status: "inativo", cotacoesRecebidas: 45, taxaResposta: 45 },
  { id: "5", razaoSocial: "Limpeza Total Ltda", cnpj: "56.789.012/0001-34", email: "comercial@limpezatotal.com.br", cidade: "Curitiba", uf: "PR", regiao: "Grande Curitiba", segmentos: ["Limpeza", "Higiene"], status: "ativo", cotacoesRecebidas: 178, taxaResposta: 78 },
];

const segmentosData: Segmento[] = [
  { id: "1", nome: "Papelaria", fornecedoresVinculados: 45 },
  { id: "2", nome: "Material de Escritório", fornecedoresVinculados: 38 },
  { id: "3", nome: "Informática", fornecedoresVinculados: 67 },
  { id: "4", nome: "Equipamentos", fornecedoresVinculados: 52 },
  { id: "5", nome: "Medicamentos", fornecedoresVinculados: 89 },
  { id: "6", nome: "Saúde", fornecedoresVinculados: 76 },
  { id: "7", nome: "Mobiliário", fornecedoresVinculados: 34 },
  { id: "8", nome: "Limpeza", fornecedoresVinculados: 56 },
  { id: "9", nome: "Higiene", fornecedoresVinculados: 48 },
  { id: "10", nome: "Alimentação", fornecedoresVinculados: 92 },
  { id: "11", nome: "Veículos", fornecedoresVinculados: 23 },
  { id: "12", nome: "Construção", fornecedoresVinculados: 41 },
];

const ufs = Object.keys(regioesPorUF);

export default function AdminFornecedores() {
  const [fornecedores, setFornecedores] = useState(fornecedoresData);
  const [segmentos, setSegmentos] = useState(segmentosData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewSegmentoDialog, setShowNewSegmentoDialog] = useState(false);
  const [showEditSegmentoDialog, setShowEditSegmentoDialog] = useState(false);
  const [showDeleteSegmentoDialog, setShowDeleteSegmentoDialog] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [selectedSegmento, setSelectedSegmento] = useState<Segmento | null>(null);
  const [newSegmentoNome, setNewSegmentoNome] = useState("");
  const [selectedUf, setSelectedUf] = useState("");
  const [selectedSegmentos, setSelectedSegmentos] = useState<string[]>([]);
  const [newFornecedor, setNewFornecedor] = useState({
    razaoSocial: "",
    cnpj: "",
    email: "",
    cidade: "",
    uf: "",
    regiao: "",
  });

  const filteredFornecedores = fornecedores.filter((f) =>
    f.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj.includes(searchTerm)
  );

  const toggleStatus = (id: string) => {
    setFornecedores((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: f.status === "ativo" ? "inativo" : "ativo" }
          : f
      )
    );
    toast.success("Status do fornecedor atualizado!");
  };

  const handleCreateFornecedor = () => {
    if (!newFornecedor.razaoSocial || !newFornecedor.cnpj || !newFornecedor.email || !newFornecedor.cidade || !newFornecedor.uf || selectedSegmentos.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const novo: Fornecedor = {
      id: String(fornecedores.length + 1),
      razaoSocial: newFornecedor.razaoSocial,
      cnpj: newFornecedor.cnpj,
      email: newFornecedor.email,
      cidade: newFornecedor.cidade,
      uf: newFornecedor.uf,
      regiao: newFornecedor.regiao,
      segmentos: selectedSegmentos,
      status: "ativo",
      cotacoesRecebidas: 0,
      taxaResposta: 0,
    };

    setFornecedores((prev) => [novo, ...prev]);
    setShowNewDialog(false);
    setNewFornecedor({ razaoSocial: "", cnpj: "", email: "", cidade: "", uf: "", regiao: "" });
    setSelectedSegmentos([]);
    setSelectedUf("");
    toast.success("Fornecedor cadastrado com sucesso!");
  };

  const handleEditFornecedor = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setSelectedUf(fornecedor.uf);
    setSelectedSegmentos(fornecedor.segmentos);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (selectedFornecedor) {
      setFornecedores((prev) =>
        prev.map((f) => (f.id === selectedFornecedor.id ? { ...selectedFornecedor, segmentos: selectedSegmentos } : f))
      );
      toast.success("Fornecedor atualizado com sucesso!");
      setShowEditDialog(false);
    }
  };

  const handleCreateSegmento = () => {
    if (!newSegmentoNome.trim()) {
      toast.error("Digite o nome do segmento");
      return;
    }

    const novo: Segmento = {
      id: String(segmentos.length + 1),
      nome: newSegmentoNome,
      fornecedoresVinculados: 0,
    };

    setSegmentos((prev) => [...prev, novo]);
    setShowNewSegmentoDialog(false);
    setNewSegmentoNome("");
    toast.success("Segmento cadastrado com sucesso!");
  };

  const handleEditSegmento = (segmento: Segmento) => {
    setSelectedSegmento(segmento);
    setNewSegmentoNome(segmento.nome);
    setShowEditSegmentoDialog(true);
  };

  const handleSaveSegmentoEdit = () => {
    if (selectedSegmento && newSegmentoNome.trim()) {
      setSegmentos((prev) =>
        prev.map((s) => (s.id === selectedSegmento.id ? { ...s, nome: newSegmentoNome } : s))
      );
      toast.success("Segmento atualizado!");
      setShowEditSegmentoDialog(false);
      setNewSegmentoNome("");
    }
  };

  const handleDeleteSegmento = (segmento: Segmento) => {
    setSelectedSegmento(segmento);
    setShowDeleteSegmentoDialog(true);
  };

  const confirmDeleteSegmento = () => {
    if (selectedSegmento) {
      setSegmentos((prev) => prev.filter((s) => s.id !== selectedSegmento.id));
      toast.success("Segmento excluído com sucesso!");
    }
  };

  const toggleSegmento = (segmento: string) => {
    setSelectedSegmentos((prev) =>
      prev.includes(segmento)
        ? prev.filter((s) => s !== segmento)
        : [...prev, segmento]
    );
  };

  const availableRegioes = selectedUf ? regioesPorUF[selectedUf as keyof typeof regioesPorUF] || [] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header title="Gestão de Fornecedores" subtitle="Gerenciar fornecedores e segmentos do sistema" />
      
      <main className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Back button */}
          <Link to="/admin">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel
            </Button>
          </Link>

          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Fornecedores</h1>
            <p className="text-muted-foreground">Gerenciar fornecedores e segmentos do sistema</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="fornecedores" className="space-y-6">
            <TabsList>
              <TabsTrigger value="fornecedores" className="gap-2">
                <Truck className="h-4 w-4" />
                Fornecedores
              </TabsTrigger>
              <TabsTrigger value="segmentos" className="gap-2">
                <Tags className="h-4 w-4" />
                Segmentos
              </TabsTrigger>
            </TabsList>

            {/* Fornecedores Tab */}
            <TabsContent value="fornecedores" className="space-y-6">
              {/* Actions */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fornecedor..."
                    className="pl-9 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="gap-2" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Novo Fornecedor
                </Button>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Segmentos</TableHead>
                      <TableHead className="text-center">Cotações</TableHead>
                      <TableHead className="text-center">Taxa Resposta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFornecedores.map((fornecedor) => (
                      <TableRow key={fornecedor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                              <Truck className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{fornecedor.razaoSocial}</p>
                              <p className="text-xs text-muted-foreground">{fornecedor.cnpj}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{fornecedor.cidade}, {fornecedor.uf}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{fornecedor.regiao}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {fornecedor.segmentos.slice(0, 2).map((seg) => (
                              <Badge key={seg} variant="secondary" className="text-xs">
                                {seg}
                              </Badge>
                            ))}
                            {fornecedor.segmentos.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{fornecedor.segmentos.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{fornecedor.cotacoesRecebidas}</TableCell>
                        <TableCell className="text-center">
                          <span className={fornecedor.taxaResposta >= 70 ? "text-success" : fornecedor.taxaResposta >= 50 ? "text-warning" : "text-destructive"}>
                            {fornecedor.taxaResposta}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={fornecedor.status === "ativo" ? "default" : "outline"}>
                            {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditFornecedor(fornecedor)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(fornecedor.id)}>
                                <Power className="h-4 w-4 mr-2" />
                                {fornecedor.status === "ativo" ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Segmentos Tab */}
            <TabsContent value="segmentos" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Segmentos de Fornecedores</h3>
                  <p className="text-sm text-muted-foreground">Gerencie os segmentos disponíveis para cadastro de fornecedores</p>
                </div>
                <Button className="gap-2" onClick={() => setShowNewSegmentoDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Novo Segmento
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {segmentos.map((segmento) => (
                  <Card key={segmento.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{segmento.nome}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSegmento(segmento)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSegmento(segmento)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {segmento.fornecedoresVinculados} fornecedor(es) vinculado(s)
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* New Supplier Dialog */}
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Fornecedor</DialogTitle>
                <DialogDescription>
                  Cadastre um novo fornecedor no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0001-00"
                    value={newFornecedor.cnpj}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    placeholder="Nome da empresa"
                    value={newFornecedor.razaoSocial}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, razaoSocial: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={newFornecedor.email}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={newFornecedor.cidade}
                    onChange={(e) => setNewFornecedor({ ...newFornecedor, cidade: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UF *</Label>
                    <Select 
                      value={selectedUf} 
                      onValueChange={(v) => {
                        setSelectedUf(v);
                        setNewFornecedor({ ...newFornecedor, uf: v, regiao: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Região da UF</Label>
                    <Select 
                      value={newFornecedor.regiao} 
                      onValueChange={(v) => setNewFornecedor({ ...newFornecedor, regiao: v })}
                      disabled={!selectedUf}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRegioes.map((regiao) => (
                          <SelectItem key={regiao} value={regiao}>
                            {regiao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Segmentos Atendidos *</Label>
                  <p className="text-xs text-muted-foreground">Selecione um ou mais segmentos</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {segmentos.map((segmento) => (
                      <div key={segmento.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`seg-${segmento.id}`}
                          checked={selectedSegmentos.includes(segmento.nome)}
                          onCheckedChange={() => toggleSegmento(segmento.nome)}
                        />
                        <label
                          htmlFor={`seg-${segmento.id}`}
                          className="text-sm text-foreground cursor-pointer"
                        >
                          {segmento.nome}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateFornecedor}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Supplier Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Fornecedor</DialogTitle>
              </DialogHeader>
              {selectedFornecedor && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={selectedFornecedor.cnpj}
                      onChange={(e) => setSelectedFornecedor({ ...selectedFornecedor, cnpj: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input
                      value={selectedFornecedor.razaoSocial}
                      onChange={(e) => setSelectedFornecedor({ ...selectedFornecedor, razaoSocial: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={selectedFornecedor.email}
                      onChange={(e) => setSelectedFornecedor({ ...selectedFornecedor, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={selectedFornecedor.cidade}
                      onChange={(e) => setSelectedFornecedor({ ...selectedFornecedor, cidade: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>UF</Label>
                      <Select 
                        value={selectedUf} 
                        onValueChange={(v) => {
                          setSelectedUf(v);
                          setSelectedFornecedor({ ...selectedFornecedor, uf: v, regiao: "" });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ufs.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Região da UF</Label>
                      <Select 
                        value={selectedFornecedor.regiao} 
                        onValueChange={(v) => setSelectedFornecedor({ ...selectedFornecedor, regiao: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRegioes.map((regiao) => (
                            <SelectItem key={regiao} value={regiao}>
                              {regiao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Segmentos Atendidos</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                      {segmentos.map((segmento) => (
                        <div key={segmento.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-seg-${segmento.id}`}
                            checked={selectedSegmentos.includes(segmento.nome)}
                            onCheckedChange={() => toggleSegmento(segmento.nome)}
                          />
                          <label
                            htmlFor={`edit-seg-${segmento.id}`}
                            className="text-sm text-foreground cursor-pointer"
                          >
                            {segmento.nome}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Segment Dialog */}
          <Dialog open={showNewSegmentoDialog} onOpenChange={setShowNewSegmentoDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Segmento</DialogTitle>
                <DialogDescription>
                  Cadastre um novo segmento para fornecedores.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="segmentoNome">Nome do Segmento *</Label>
                  <Input
                    id="segmentoNome"
                    placeholder="Ex: Materiais Hospitalares"
                    value={newSegmentoNome}
                    onChange={(e) => setNewSegmentoNome(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSegmentoDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSegmento}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Segment Dialog */}
          <Dialog open={showEditSegmentoDialog} onOpenChange={setShowEditSegmentoDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Segmento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editSegmentoNome">Nome do Segmento</Label>
                  <Input
                    id="editSegmentoNome"
                    value={newSegmentoNome}
                    onChange={(e) => setNewSegmentoNome(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditSegmentoDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSegmentoEdit}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Segment Password Confirmation */}
          <PasswordConfirmDialog
            open={showDeleteSegmentoDialog}
            onOpenChange={setShowDeleteSegmentoDialog}
            title="Excluir Segmento"
            description={`Tem certeza que deseja excluir o segmento "${selectedSegmento?.nome}"? Esta ação não pode ser desfeita. Digite sua senha para confirmar.`}
            onConfirm={confirmDeleteSegmento}
            confirmText="Excluir"
            confirmVariant="destructive"
          />
        </div>
      </main>
    </div>
  );
}
