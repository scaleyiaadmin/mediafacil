import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Building2, MoreVertical, Edit, Eye, Power, Upload, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { PasswordConfirmDialog } from "@/components/PasswordConfirmDialog";

interface Entidade {
  id: string;
  nome: string;
  logo?: string;
  cidade: string;
  uf: string;
  cnpj: string;
  tipo: string;
  telefone: string;
  endereco: string;
  usuarioPrincipal: {
    nome: string;
    email: string;
  };
  status: "ativo" | "inativo";
  usuarios: number;
  orcamentos: number;
}

const entidadesData: Entidade[] = [
  { 
    id: "1", 
    nome: "Prefeitura Municipal de São Paulo", 
    cidade: "São Paulo", 
    uf: "SP", 
    cnpj: "46.634.507/0001-00", 
    tipo: "Prefeitura", 
    telefone: "(11) 3333-4444",
    endereco: "Praça da Sé, 1 - Centro",
    usuarioPrincipal: { nome: "João da Silva", email: "joao.silva@prefeitura-sp.gov.br" },
    status: "ativo", 
    usuarios: 12, 
    orcamentos: 156 
  },
  { 
    id: "2", 
    nome: "Prefeitura Municipal de Campinas", 
    cidade: "Campinas", 
    uf: "SP", 
    cnpj: "51.885.242/0001-40", 
    tipo: "Prefeitura", 
    telefone: "(19) 2222-3333",
    endereco: "Av. Anchieta, 200 - Centro",
    usuarioPrincipal: { nome: "Carlos Oliveira", email: "carlos@prefeitura-campinas.gov.br" },
    status: "ativo", 
    usuarios: 8, 
    orcamentos: 89 
  },
  { 
    id: "3", 
    nome: "Câmara Municipal de Santos", 
    cidade: "Santos", 
    uf: "SP", 
    cnpj: "58.200.015/0001-83", 
    tipo: "Câmara", 
    telefone: "(13) 1111-2222",
    endereco: "Rua XV de Novembro, 100",
    usuarioPrincipal: { nome: "Ana Paula Lima", email: "ana.lima@camara-santos.gov.br" },
    status: "ativo", 
    usuarios: 4, 
    orcamentos: 34 
  },
  { 
    id: "4", 
    nome: "Prefeitura Municipal de Ribeirão Preto", 
    cidade: "Ribeirão Preto", 
    uf: "SP", 
    cnpj: "56.024.581/0001-56", 
    tipo: "Prefeitura", 
    telefone: "(16) 4444-5555",
    endereco: "Rua Bernardino de Campos, 50",
    usuarioPrincipal: { nome: "Pedro Ferreira", email: "pedro@prefeitura-rp.gov.br" },
    status: "inativo", 
    usuarios: 6, 
    orcamentos: 45 
  },
];

export default function AdminEntidades() {
  const [entidades, setEntidades] = useState(entidadesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEntidade, setSelectedEntidade] = useState<Entidade | null>(null);
  const [newEntidade, setNewEntidade] = useState({
    nome: "",
    cidade: "",
    uf: "",
    cnpj: "",
    tipo: "",
    telefone: "",
    endereco: "",
    usuarioNome: "",
    usuarioEmail: "",
    usuarioSenha: "",
  });

  const filteredEntidades = entidades.filter((e) =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setEntidades((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "ativo" ? "inativo" : "ativo" }
          : e
      )
    );
    toast.success("Status atualizado com sucesso!");
  };

  const handleCreateEntidade = () => {
    if (!newEntidade.nome || !newEntidade.cidade || !newEntidade.uf || !newEntidade.usuarioNome || !newEntidade.usuarioEmail || !newEntidade.usuarioSenha) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    const nova: Entidade = {
      id: String(entidades.length + 1),
      nome: newEntidade.nome,
      cidade: newEntidade.cidade,
      uf: newEntidade.uf,
      cnpj: newEntidade.cnpj,
      tipo: newEntidade.tipo,
      telefone: newEntidade.telefone,
      endereco: newEntidade.endereco,
      usuarioPrincipal: {
        nome: newEntidade.usuarioNome,
        email: newEntidade.usuarioEmail,
      },
      status: "ativo",
      usuarios: 1,
      orcamentos: 0,
    };
    
    setEntidades((prev) => [nova, ...prev]);
    setShowNewDialog(false);
    setNewEntidade({ nome: "", cidade: "", uf: "", cnpj: "", tipo: "", telefone: "", endereco: "", usuarioNome: "", usuarioEmail: "", usuarioSenha: "" });
    toast.success("Entidade cadastrada com sucesso! Usuário principal criado.");
  };

  const handleViewEntidade = (entidade: Entidade) => {
    setSelectedEntidade(entidade);
    setShowViewDialog(true);
  };

  const handleEditEntidade = (entidade: Entidade) => {
    setSelectedEntidade(entidade);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (selectedEntidade) {
      setEntidades((prev) =>
        prev.map((e) => (e.id === selectedEntidade.id ? selectedEntidade : e))
      );
      toast.success("Entidade atualizada com sucesso!");
      setShowEditDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Gestão de Entidades" subtitle="Cadastrar e gerenciar prefeituras e entidades" />
      
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
            <h1 className="text-2xl font-bold text-foreground">Gestão de Entidades</h1>
            <p className="text-muted-foreground">Cadastrar e gerenciar prefeituras e entidades</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar entidade..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="gap-2" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4" />
              Nova Entidade
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Usuário Principal</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Usuários</TableHead>
                  <TableHead className="text-center">Orçamentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntidades.map((entidade) => (
                  <TableRow key={entidade.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          {entidade.logo ? (
                            <img src={entidade.logo} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{entidade.nome}</p>
                          <p className="text-xs text-muted-foreground">{entidade.cnpj}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{entidade.cidade}, {entidade.uf}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{entidade.usuarioPrincipal.nome}</p>
                        <p className="text-xs text-muted-foreground">{entidade.usuarioPrincipal.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entidade.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{entidade.usuarios}</TableCell>
                    <TableCell className="text-center">{entidade.orcamentos}</TableCell>
                    <TableCell>
                      <Badge variant={entidade.status === "ativo" ? "default" : "outline"}>
                        {entidade.status === "ativo" ? "Ativo" : "Inativo"}
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
                          <DropdownMenuItem onClick={() => handleViewEntidade(entidade)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditEntidade(entidade)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(entidade.id)}>
                            <Power className="h-4 w-4 mr-2" />
                            {entidade.status === "ativo" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* New Entity Dialog */}
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Entidade</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova prefeitura ou entidade no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo da Entidade</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Button variant="outline" size="sm">
                      Escolher imagem
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Entidade *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Prefeitura Municipal de..."
                    value={newEntidade.nome}
                    onChange={(e) => setNewEntidade({ ...newEntidade, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      placeholder="Cidade"
                      value={newEntidade.cidade}
                      onChange={(e) => setNewEntidade({ ...newEntidade, cidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF *</Label>
                    <Input
                      id="uf"
                      placeholder="UF"
                      maxLength={2}
                      value={newEntidade.uf}
                      onChange={(e) => setNewEntidade({ ...newEntidade, uf: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número - Bairro"
                    value={newEntidade.endereco}
                    onChange={(e) => setNewEntidade({ ...newEntidade, endereco: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0001-00"
                      value={newEntidade.cnpj}
                      onChange={(e) => setNewEntidade({ ...newEntidade, cnpj: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 0000-0000"
                      value={newEntidade.telefone}
                      onChange={(e) => setNewEntidade({ ...newEntidade, telefone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Entidade</Label>
                  <Select value={newEntidade.tipo} onValueChange={(v) => setNewEntidade({ ...newEntidade, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prefeitura">Prefeitura</SelectItem>
                      <SelectItem value="Câmara">Câmara Municipal</SelectItem>
                      <SelectItem value="Secretaria">Secretaria</SelectItem>
                      <SelectItem value="Autarquia">Autarquia</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-4" />

                {/* Usuário Principal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Usuário Principal</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usuarioNome">Nome do Usuário *</Label>
                    <Input
                      id="usuarioNome"
                      placeholder="Nome completo"
                      value={newEntidade.usuarioNome}
                      onChange={(e) => setNewEntidade({ ...newEntidade, usuarioNome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usuarioEmail">E-mail *</Label>
                    <Input
                      id="usuarioEmail"
                      type="email"
                      placeholder="email@entidade.gov.br"
                      value={newEntidade.usuarioEmail}
                      onChange={(e) => setNewEntidade({ ...newEntidade, usuarioEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usuarioSenha">Senha Inicial *</Label>
                    <Input
                      id="usuarioSenha"
                      type="password"
                      placeholder="Defina uma senha"
                      value={newEntidade.usuarioSenha}
                      onChange={(e) => setNewEntidade({ ...newEntidade, usuarioSenha: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEntidade}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Entity Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Detalhes da Entidade</DialogTitle>
              </DialogHeader>
              {selectedEntidade && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-accent">
                      <Building2 className="h-8 w-8 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{selectedEntidade.nome}</h3>
                      <p className="text-sm text-muted-foreground">{selectedEntidade.cnpj}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cidade/UF</p>
                      <p className="text-foreground">{selectedEntidade.cidade}, {selectedEntidade.uf}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="text-foreground">{selectedEntidade.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="text-foreground">{selectedEntidade.telefone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedEntidade.status === "ativo" ? "default" : "outline"}>
                        {selectedEntidade.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="text-foreground">{selectedEntidade.endereco || "-"}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Usuário Principal</p>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{selectedEntidade.usuarioPrincipal.nome}</p>
                        <p className="text-sm text-muted-foreground">{selectedEntidade.usuarioPrincipal.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Entity Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Entidade</DialogTitle>
              </DialogHeader>
              {selectedEntidade && (
                <div className="space-y-4 py-4">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Logo da Entidade</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <Button variant="outline" size="sm">
                        Alterar imagem
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-nome">Nome da Entidade</Label>
                    <Input
                      id="edit-nome"
                      value={selectedEntidade.nome}
                      onChange={(e) => setSelectedEntidade({ ...selectedEntidade, nome: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-cidade">Cidade</Label>
                      <Input
                        id="edit-cidade"
                        value={selectedEntidade.cidade}
                        onChange={(e) => setSelectedEntidade({ ...selectedEntidade, cidade: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-uf">UF</Label>
                      <Input
                        id="edit-uf"
                        value={selectedEntidade.uf}
                        onChange={(e) => setSelectedEntidade({ ...selectedEntidade, uf: e.target.value.toUpperCase() })}
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endereco">Endereço</Label>
                    <Input
                      id="edit-endereco"
                      value={selectedEntidade.endereco}
                      onChange={(e) => setSelectedEntidade({ ...selectedEntidade, endereco: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-cnpj">CNPJ</Label>
                      <Input
                        id="edit-cnpj"
                        value={selectedEntidade.cnpj}
                        onChange={(e) => setSelectedEntidade({ ...selectedEntidade, cnpj: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-telefone">Telefone</Label>
                      <Input
                        id="edit-telefone"
                        value={selectedEntidade.telefone}
                        onChange={(e) => setSelectedEntidade({ ...selectedEntidade, telefone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tipo">Tipo de Entidade</Label>
                    <Select 
                      value={selectedEntidade.tipo} 
                      onValueChange={(v) => setSelectedEntidade({ ...selectedEntidade, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prefeitura">Prefeitura</SelectItem>
                        <SelectItem value="Câmara">Câmara Municipal</SelectItem>
                        <SelectItem value="Secretaria">Secretaria</SelectItem>
                        <SelectItem value="Autarquia">Autarquia</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
