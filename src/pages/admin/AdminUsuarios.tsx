import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Users, MoreVertical, Edit, Eye, LogIn } from "lucide-react";
import { useSupportMode } from "@/contexts/SupportModeContext";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  entidade: string;
  setor: string;
  cargo: string;
  tipo: "principal" | "secundario";
  status: "ativo" | "inativo";
  ultimoAcesso: string;
  orcamentos: number;
}

const usuariosData: Usuario[] = [
  { id: "1", nome: "João da Silva", email: "joao.silva@prefeitura-sp.gov.br", entidade: "Prefeitura Municipal de São Paulo", setor: "Compras", cargo: "Coordenador de Compras", tipo: "principal", status: "ativo", ultimoAcesso: "13/01/2026", orcamentos: 45 },
  { id: "2", nome: "Maria Santos", email: "maria.santos@prefeitura-sp.gov.br", entidade: "Prefeitura Municipal de São Paulo", setor: "Educação", cargo: "Analista", tipo: "secundario", status: "ativo", ultimoAcesso: "12/01/2026", orcamentos: 23 },
  { id: "3", nome: "Carlos Oliveira", email: "carlos@prefeitura-campinas.gov.br", entidade: "Prefeitura Municipal de Campinas", setor: "Saúde", cargo: "Diretor de Compras", tipo: "principal", status: "ativo", ultimoAcesso: "11/01/2026", orcamentos: 67 },
  { id: "4", nome: "Ana Paula Lima", email: "ana.lima@camara-santos.gov.br", entidade: "Câmara Municipal de Santos", setor: "Administrativo", cargo: "Coordenadora", tipo: "principal", status: "ativo", ultimoAcesso: "10/01/2026", orcamentos: 34 },
  { id: "5", nome: "Pedro Ferreira", email: "pedro@prefeitura-rp.gov.br", entidade: "Prefeitura Municipal de Ribeirão Preto", setor: "TI", cargo: "Analista de TI", tipo: "secundario", status: "inativo", ultimoAcesso: "05/01/2026", orcamentos: 12 },
];

const entidades = [
  "Todas as entidades",
  "Prefeitura Municipal de São Paulo",
  "Prefeitura Municipal de Campinas",
  "Câmara Municipal de Santos",
  "Prefeitura Municipal de Ribeirão Preto",
];

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState(usuariosData);
  const [searchTerm, setSearchTerm] = useState("");
  const [entidadeFilter, setEntidadeFilter] = useState("Todas as entidades");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  
  const navigate = useNavigate();
  const { enterSupportMode } = useSupportMode();

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntidade =
      entidadeFilter === "Todas as entidades" || u.entidade === entidadeFilter;
    return matchesSearch && matchesEntidade;
  });

  const handleAccessAccount = (usuario: Usuario) => {
    enterSupportMode({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      entidade: usuario.entidade,
    });
    toast.success(`Modo suporte ativado`, {
      description: `Você está acessando a conta de ${usuario.nome}`,
    });
    navigate("/");
  };

  const handleViewPerfil = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowViewDialog(true);
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (selectedUsuario) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === selectedUsuario.id ? selectedUsuario : u))
      );
      toast.success("Usuário atualizado com sucesso!");
      setShowEditDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Gestão de Usuários" subtitle="Visualizar e gerenciar usuários das entidades" />
      
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
            <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground">Visualizar e gerenciar usuários das entidades</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  className="pl-9 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={entidadeFilter} onValueChange={setEntidadeFilter}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entidades.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Entidade / Setor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Orçamentos</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{usuario.nome}</p>
                          <p className="text-xs text-muted-foreground">{usuario.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{usuario.entidade}</p>
                        <p className="text-xs text-muted-foreground">{usuario.setor}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.tipo === "principal" ? "default" : "secondary"}>
                        {usuario.tipo === "principal" ? "Principal" : "Secundário"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{usuario.orcamentos}</TableCell>
                    <TableCell className="text-muted-foreground">{usuario.ultimoAcesso}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.status === "ativo" ? "default" : "outline"}>
                        {usuario.status === "ativo" ? "Ativo" : "Inativo"}
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
                          <DropdownMenuItem onClick={() => handleViewPerfil(usuario)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUsuario(usuario)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAccessAccount(usuario)}>
                            <LogIn className="h-4 w-4 mr-2" />
                            Acessar Conta (Suporte)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Count */}
          <div className="text-center text-sm text-muted-foreground">
            Exibindo {filteredUsuarios.length} usuário(s)
          </div>

          {/* View Profile Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Perfil do Usuário</DialogTitle>
              </DialogHeader>
              {selectedUsuario && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{selectedUsuario.nome}</h3>
                      <p className="text-sm text-muted-foreground">{selectedUsuario.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cargo</p>
                      <p className="text-foreground">{selectedUsuario.cargo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Setor</p>
                      <p className="text-foreground">{selectedUsuario.setor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Acesso</p>
                      <Badge variant={selectedUsuario.tipo === "principal" ? "default" : "secondary"}>
                        {selectedUsuario.tipo === "principal" ? "Principal" : "Secundário"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedUsuario.status === "ativo" ? "default" : "outline"}>
                        {selectedUsuario.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Entidade</p>
                    <p className="text-foreground">{selectedUsuario.entidade}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Orçamentos Criados</p>
                      <p className="text-lg font-semibold text-foreground">{selectedUsuario.orcamentos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Último Acesso</p>
                      <p className="text-foreground">{selectedUsuario.ultimoAcesso}</p>
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

          {/* Edit User Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              {selectedUsuario && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nome">Nome</Label>
                    <Input
                      id="edit-nome"
                      value={selectedUsuario.nome}
                      onChange={(e) => setSelectedUsuario({ ...selectedUsuario, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">E-mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={selectedUsuario.email}
                      onChange={(e) => setSelectedUsuario({ ...selectedUsuario, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cargo">Cargo</Label>
                    <Input
                      id="edit-cargo"
                      value={selectedUsuario.cargo}
                      onChange={(e) => setSelectedUsuario({ ...selectedUsuario, cargo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-setor">Setor</Label>
                    <Input
                      id="edit-setor"
                      value={selectedUsuario.setor}
                      onChange={(e) => setSelectedUsuario({ ...selectedUsuario, setor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={selectedUsuario.status} 
                      onValueChange={(v: "ativo" | "inativo") => setSelectedUsuario({ ...selectedUsuario, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
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
        </div>
      </main>
    </div>
  );
}
