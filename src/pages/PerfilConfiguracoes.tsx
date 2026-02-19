import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Users, Building2, Edit, Trash2, Eye, UserPlus, Shield, AlertCircle, Lock } from "lucide-react";
import { ufs } from "@/data/regioes";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  setor: string;
  status: "ativo" | "inativo";
}

const usuariosMock: Usuario[] = [
  { id: "1", nome: "Maria Silva", email: "maria.silva@prefeitura.gov.br", setor: "Secretaria de Educação", status: "ativo" },
  { id: "2", nome: "João Santos", email: "joao.santos@prefeitura.gov.br", setor: "Secretaria de Saúde", status: "ativo" },
  { id: "3", nome: "Ana Costa", email: "ana.costa@prefeitura.gov.br", setor: "Administração", status: "inativo" },
];

export default function PerfilConfiguracoes() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosMock);
  const [dialogNovoUsuario, setDialogNovoUsuario] = useState(false);
  const [dialogEditarUsuario, setDialogEditarUsuario] = useState(false);
  const [dialogAlterarSenha, setDialogAlterarSenha] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  
  // Perfil
  const [perfil, setPerfil] = useState({
    nome: "Administrador Principal",
    email: "admin@prefeitura.gov.br",
    cargo: "Diretor de Compras",
    entidade: "Prefeitura Municipal de Exemplo",
    cidade: "Cidade Exemplo",
    uf: "SP"
  });

  // Novo usuário
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    setor: "",
    senha: ""
  });

  // Entidade
  const [entidade, setEntidade] = useState({
    nome: "Prefeitura Municipal de Exemplo",
    cidade: "Cidade Exemplo",
    uf: "SP",
    cnpj: "12.345.678/0001-90",
    tipo: "Prefeitura Municipal"
  });

  const handleSalvarPerfil = () => {
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleAlterarSenha = () => {
    toast.success("Senha alterada com sucesso!");
    setDialogAlterarSenha(false);
  };

  const handleAdicionarUsuario = () => {
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.setor) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const novo: Usuario = {
      id: String(Date.now()),
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      setor: novoUsuario.setor,
      status: "ativo"
    };

    setUsuarios([...usuarios, novo]);
    setNovoUsuario({ nome: "", email: "", setor: "", senha: "" });
    setDialogNovoUsuario(false);
    toast.success("Usuário cadastrado com sucesso!");
  };

  const handleToggleStatus = (id: string) => {
    setUsuarios(usuarios.map(u => 
      u.id === id ? { ...u, status: u.status === "ativo" ? "inativo" : "ativo" } : u
    ));
    toast.success("Status do usuário alterado.");
  };

  const handleRemoverUsuario = (id: string) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
    toast.success("Usuário removido com sucesso.");
  };

  const handleSalvarEntidade = () => {
    toast.success("Configurações da entidade salvas com sucesso!");
  };

  return (
    <MainLayout title="Perfil e Configurações">
      <div className="max-w-5xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="entidade" className="gap-2">
              <Building2 className="h-4 w-4" />
              Configurações da Entidade
            </TabsTrigger>
          </TabsList>

          {/* ABA MEU PERFIL */}
          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Usuário Principal (Administrador)
                    </CardTitle>
                    <CardDescription>
                      Gerencie suas informações de perfil
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    Administrador
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input 
                      id="nome"
                      value={perfil.nome}
                      onChange={(e) => setPerfil({...perfil, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={perfil.email}
                      onChange={(e) => setPerfil({...perfil, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo / Função</Label>
                    <Input 
                      id="cargo"
                      value={perfil.cargo}
                      onChange={(e) => setPerfil({...perfil, cargo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entidadePerfil">Entidade</Label>
                    <Input 
                      id="entidadePerfil"
                      value={perfil.entidade}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidadePerfil">Cidade</Label>
                    <Input 
                      id="cidadePerfil"
                      value={perfil.cidade}
                      onChange={(e) => setPerfil({...perfil, cidade: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufPerfil">UF</Label>
                    <Select value={perfil.uf} onValueChange={(value) => setPerfil({...perfil, uf: value})}>
                      <SelectTrigger id="ufPerfil">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <Button onClick={handleSalvarPerfil}>Salvar Alterações</Button>
                  <Dialog open={dialogAlterarSenha} onOpenChange={setDialogAlterarSenha}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Alterar Senha
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                          Digite sua senha atual e a nova senha
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="senhaAtual">Senha atual</Label>
                          <Input id="senhaAtual" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="novaSenha">Nova senha</Label>
                          <Input id="novaSenha" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                          <Input id="confirmarSenha" type="password" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogAlterarSenha(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAlterarSenha}>Alterar Senha</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Info Box */}
                <div className="rounded-lg bg-info/10 border border-info/30 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-info mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Regra de visualização</p>
                    <p className="text-muted-foreground">
                      O usuário principal visualiza apenas os orçamentos criados por ele. 
                      Não é possível visualizar orçamentos criados por usuários secundários.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA USUÁRIOS */}
          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usuários Secundários</CardTitle>
                    <CardDescription>
                      Gerencie os usuários vinculados à sua entidade
                    </CardDescription>
                  </div>
                  <Dialog open={dialogNovoUsuario} onOpenChange={setDialogNovoUsuario}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Cadastrar Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                        <DialogDescription>
                          Adicione um novo usuário secundário à sua entidade
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="novoNome">Nome completo *</Label>
                          <Input 
                            id="novoNome"
                            value={novoUsuario.nome}
                            onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="novoEmail">E-mail (login) *</Label>
                          <Input 
                            id="novoEmail"
                            type="email"
                            value={novoUsuario.email}
                            onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="novoSetor">Secretaria ou Setor *</Label>
                          <Input 
                            id="novoSetor"
                            value={novoUsuario.setor}
                            onChange={(e) => setNovoUsuario({...novoUsuario, setor: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="novoSenha">Senha inicial</Label>
                          <Input 
                            id="novoSenha"
                            type="password"
                            value={novoUsuario.senha}
                            onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                            placeholder="Deixe vazio para enviar link de ativação"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogNovoUsuario(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAdicionarUsuario}>Cadastrar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Info Box */}
                <div className="rounded-lg bg-muted/50 border border-border p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    <strong>Regra de acesso:</strong> Usuários secundários acessam somente os próprios orçamentos. 
                    O usuário principal acessa somente os orçamentos criados por ele.
                  </p>
                </div>

                {/* Lista de Usuários */}
                <div className="space-y-3">
                  {usuarios.map((usuario) => (
                    <div 
                      key={usuario.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{usuario.nome}</p>
                          <p className="text-sm text-muted-foreground">{usuario.email}</p>
                          <p className="text-xs text-muted-foreground">{usuario.setor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={usuario.status === "ativo" ? "default" : "secondary"}
                          className={usuario.status === "ativo" ? "bg-success/10 text-success border-success/30" : ""}
                        >
                          {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setDialogEditarUsuario(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(usuario.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoverUsuario(usuario.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {usuarios.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário secundário cadastrado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog Editar Usuário */}
            <Dialog open={dialogEditarUsuario} onOpenChange={setDialogEditarUsuario}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Usuário</DialogTitle>
                  <DialogDescription>
                    Altere as informações do usuário
                  </DialogDescription>
                </DialogHeader>
                {usuarioSelecionado && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editNome">Nome completo</Label>
                      <Input 
                        id="editNome"
                        defaultValue={usuarioSelecionado.nome}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmail">E-mail</Label>
                      <Input 
                        id="editEmail"
                        type="email"
                        defaultValue={usuarioSelecionado.email}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editSetor">Secretaria ou Setor</Label>
                      <Input 
                        id="editSetor"
                        defaultValue={usuarioSelecionado.setor}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogEditarUsuario(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => {
                    toast.success("Usuário atualizado com sucesso!");
                    setDialogEditarUsuario(false);
                  }}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ABA CONFIGURAÇÕES DA ENTIDADE */}
          <TabsContent value="entidade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Entidade</CardTitle>
                <CardDescription>
                  Informações que aparecerão nos relatórios e documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nomeEntidade">Nome da Entidade</Label>
                    <Input 
                      id="nomeEntidade"
                      value={entidade.nome}
                      onChange={(e) => setEntidade({...entidade, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidadeEntidade">Cidade</Label>
                    <Input 
                      id="cidadeEntidade"
                      value={entidade.cidade}
                      onChange={(e) => setEntidade({...entidade, cidade: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufEntidade">UF</Label>
                    <Select value={entidade.uf} onValueChange={(value) => setEntidade({...entidade, uf: value})}>
                      <SelectTrigger id="ufEntidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpjEntidade">CNPJ</Label>
                    <Input 
                      id="cnpjEntidade"
                      value={entidade.cnpj}
                      onChange={(e) => setEntidade({...entidade, cnpj: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoEntidade">Tipo de Entidade</Label>
                    <Select value={entidade.tipo} onValueChange={(value) => setEntidade({...entidade, tipo: value})}>
                      <SelectTrigger id="tipoEntidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prefeitura Municipal">Prefeitura Municipal</SelectItem>
                        <SelectItem value="Câmara Municipal">Câmara Municipal</SelectItem>
                        <SelectItem value="Autarquia">Autarquia</SelectItem>
                        <SelectItem value="Fundação">Fundação</SelectItem>
                        <SelectItem value="Consórcio Público">Consórcio Público</SelectItem>
                        <SelectItem value="Estado">Estado</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button onClick={handleSalvarEntidade}>Salvar Configurações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
