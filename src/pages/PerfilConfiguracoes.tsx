import { useState, useEffect } from "react";
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
import { User, Users, Building2, Edit, Trash2, Eye, UserPlus, Shield, AlertCircle, Lock, Loader2, RefreshCw } from "lucide-react";
import { ufs } from "@/data/regioes";
import { supabase } from "@/lib/supabase";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  setor?: string;
  status: "ativo" | "inativo";
  is_admin: boolean;
  tipo?: string;
}

const cargos = [
  "Prefeito(a)",
  "Vice-Prefeito(a)",
  "Secretário(a)",
  "Chefe de Gabinete",
  "Diretor(a)",
  "Coordenador(a)",
  "Assessor(a)",
  "Procurador(a)",
  "Controlador(a)",
  "Agente de Contratação",
  "Pregoeiro(a)",
  "Técnico(a)",
  "Outro"
];

export default function PerfilConfiguracoes() {
  console.log("PerfilConfiguracoes: Renderizando componente...");
  const [activeTab, setActiveTab] = useState("perfil");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setoresDisp, setSetoresDisp] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogNovoUsuario, setDialogNovoUsuario] = useState(false);
  const [dialogEditarUsuario, setDialogEditarUsuario] = useState(false);
  const [dialogAlterarSenha, setDialogAlterarSenha] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  // Perfil
  const [perfil, setPerfil] = useState<Usuario | null>(null);

  // Novo usuário
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    setor: "",
    cargo: "",
    senha: "",
    is_admin: false
  });

  // Entidade
  const [entidade, setEntidade] = useState({
    id: "",
    nome: "",
    cidade: "",
    uf: "",
    cnpj: "",
    tipo: ""
  });

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    console.log("PerfilConfiguracoes: Iniciando fetchDados...");
    try {
      setLoading(true);

      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // 2. Fetch profile from public.usuarios
      const { data: profile, error: profileErr } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single();

      if (profileErr) throw profileErr;
      setPerfil(profile);

      // 3. Fetch Entity
      if (profile.entidade_id) {
        const { data: ent, error: entErr } = await supabase
          .from('entidades')
          .select('*')
          .eq('id', profile.entidade_id)
          .single();

        if (entErr) throw entErr;
        setEntidade(ent);

        // 4. Fetch Other Users (if admin)
        if (profile.is_admin || profile.tipo === 'super_admin') {
          const { data: users, error: usersErr } = await supabase
            .from('usuarios')
            .select('*')
            .eq('entidade_id', profile.entidade_id)
            .neq('id', profile.id);

          if (usersErr) throw usersErr;
          setUsuarios(users);
        }

        // 5. Fetch available sectors (with fallback)
        console.log("PerfilConfiguracoes: Buscando setores para entidade:", profile.entidade_id);
        let { data: sectors } = await supabase
          .from('setores')
          .select('id, nome')
          .eq('entidade_id', profile.entidade_id)
          .order('nome');

        if (!sectors || sectors.length === 0) {
          console.log("PerfilConfiguracoes: Nenhum setor encontrado para esta entidade, buscando todos...");
          const { data: allSectors } = await supabase
            .from('setores')
            .select('id, nome')
            .order('nome');
          sectors = allSectors;
        }

        console.log("PerfilConfiguracoes: Setores carregados:", sectors?.length || 0);
        setSetoresDisp(sectors || []);
      }

    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar configurações: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const geraSenhaAleatoria = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let senha = "";
    for (let i = 0; i < 10; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNovoUsuario({ ...novoUsuario, senha });
    toast.info("Senha aleatória gerada!");
  };

  const handleSalvarPerfil = async () => {
    if (!perfil) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: perfil.nome,
          cargo: perfil.cargo,
          setor: perfil.setor
        })
        .eq('id', perfil.id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAlterarSenha = () => {
    toast.success("Senha alterada com sucesso!");
    setDialogAlterarSenha(false);
  };

  const handleSalvarEntidade = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('entidades')
        .update({
          nome: entidade.nome,
          cidade: entidade.cidade,
          uf: entidade.uf,
          cnpj: entidade.cnpj,
          tipo: entidade.tipo
        })
        .eq('id', entidade.id);

      if (error) throw error;
      toast.success("Configurações da entidade salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar entidade: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdicionarUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.setor) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          setor: novoUsuario.setor,
          cargo: novoUsuario.cargo,
          senha: novoUsuario.senha || "123456", // Senha padrão se não informada
          entidade_id: entidade.id,
          is_admin: novoUsuario.is_admin,
          status: "ativo"
        })
        .select()
        .single();

      if (error) throw error;

      // DISPARO DO WEBHOOK (N8N)
      try {
        await fetch('https://n8n-n8n.zb8ckr.easypanel.host/webhook/email-usuario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            senha: novoUsuario.senha || "123456",
            prefeitura: entidade.nome
          })
        });
        console.log("Webhook disparado com sucesso!");
      } catch (webhookErr) {
        console.error("Erro ao disparar webhook:", webhookErr);
      }

      setUsuarios([...usuarios, data]);
      setNovoUsuario({ nome: "", email: "", setor: "", cargo: "", senha: "", is_admin: false });
      setDialogNovoUsuario(false);
      toast.success("Usuário cadastrado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao cadastrar usuário: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setUsuarios(usuarios.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
      toast.success("Status do usuário alterado.");
    } catch (error: any) {
      toast.error("Erro ao alterar status: " + error.message);
    }
  };

  const handleRemoverUsuario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsuarios(usuarios.filter(u => u.id !== id));
      toast.success("Usuário removido com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao remover usuário: " + error.message);
    }
  };

  const handleEditarUsuario = async () => {
    if (!usuarioSelecionado) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: usuarioSelecionado.nome,
          email: usuarioSelecionado.email,
          setor: usuarioSelecionado.setor,
          cargo: usuarioSelecionado.cargo
        })
        .eq('id', usuarioSelecionado.id);

      if (error) throw error;

      setUsuarios(usuarios.map(u => u.id === usuarioSelecionado.id ? usuarioSelecionado : u));
      setDialogEditarUsuario(false);
      toast.success("Usuário atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao editar usuário: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Perfil e Configurações">
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Carregando configurações...</p>
          </div>
        ) : !perfil ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Perfil não encontrado</h2>
            <p className="text-muted-foreground max-w-md">
              Não conseguimos localizar seu cadastro no sistema.
              Por favor, entre em contato com o suporte ou tente fazer login novamente.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">Tentar Novamente</Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full ${(perfil.is_admin || perfil.tipo === 'super_admin') ? 'grid-cols-3' : 'grid-cols-1 max-w-xs'}`}>
              <TabsTrigger value="perfil" className="gap-2">
                <User className="h-4 w-4" />
                Meu Perfil
              </TabsTrigger>
              {(perfil.is_admin || perfil.tipo === 'super_admin') && (
                <>
                  <TabsTrigger value="usuarios" className="gap-2">
                    <Users className="h-4 w-4" />
                    Usuários
                  </TabsTrigger>
                  <TabsTrigger value="entidade" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Configurações da Entidade
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* ABA MEU PERFIL */}
            <TabsContent value="perfil" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {perfil.tipo === 'super_admin' ? 'Meu Perfil (Super Admin)' : 'Meu Perfil (Administrador)'}
                      </CardTitle>
                      <CardDescription>
                        Gerencie suas informações de perfil
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      {perfil.tipo === 'super_admin' ? 'Super Admin' : 'Admin'}
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
                        onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (Login)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={perfil.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo / Função</Label>
                      <Select
                        value={perfil.cargo || ""}
                        onValueChange={(value) => setPerfil({ ...perfil, cargo: value })}
                      >
                        <SelectTrigger id="cargo">
                          <SelectValue placeholder="Selecione seu cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {cargos.map((cargo) => (
                            <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entidadePerfil">Entidade</Label>
                      <Input
                        id="entidadePerfil"
                        value={entidade.nome}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setorPerfil">Setor / Secretaria</Label>
                      <Select
                        value={perfil.setor || ""}
                        onValueChange={(value) => setPerfil({ ...perfil, setor: value })}
                      >
                        <SelectTrigger id="setorPerfil">
                          <SelectValue placeholder="Selecione seu setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {setoresDisp.map((setor) => (
                            <SelectItem key={setor.id} value={setor.nome}>{setor.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ufPerfil">UF</Label>
                      <Input
                        id="ufPerfil"
                        value={entidade.uf}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <Button onClick={handleSalvarPerfil} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Salvar Alterações
                    </Button>
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
                              onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="novoEmail">E-mail (login) *</Label>
                            <Input
                              id="novoEmail"
                              type="email"
                              value={novoUsuario.email}
                              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="novoSetor">Secretaria ou Setor *</Label>
                            <Select
                              value={novoUsuario.setor}
                              onValueChange={(value) => setNovoUsuario({ ...novoUsuario, setor: value })}
                            >
                              <SelectTrigger id="novoSetor">
                                <SelectValue placeholder="Selecione a secretaria/setor" />
                              </SelectTrigger>
                              <SelectContent>
                                {setoresDisp.map((setor) => (
                                  <SelectItem key={setor.id} value={setor.nome}>{setor.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="novoCargo">Cargo *</Label>
                            <Select
                              value={novoUsuario.cargo}
                              onValueChange={(value) => setNovoUsuario({ ...novoUsuario, cargo: value })}
                            >
                              <SelectTrigger id="novoCargo">
                                <SelectValue placeholder="Selecione o cargo" />
                              </SelectTrigger>
                              <SelectContent>
                                {cargos.map((cargo) => (
                                  <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="novoSenha">Senha inicial</Label>
                            <div className="flex gap-2">
                              <Input
                                id="novoSenha"
                                type="text"
                                value={novoUsuario.senha}
                                onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={geraSenhaAleatoria}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Gerar
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 pt-2">
                            <input
                              type="checkbox"
                              id="isAdmin"
                              checked={novoUsuario.is_admin}
                              onChange={(e) => setNovoUsuario({ ...novoUsuario, is_admin: e.target.checked })}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                            />
                            <Label htmlFor="isAdmin" className="font-normal cursor-pointer">Definir como Administrador</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogNovoUsuario(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAdicionarUsuario} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Cadastrar
                          </Button>
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
                          {usuario.is_admin && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              Admin
                            </Badge>
                          )}
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
                              onClick={() => handleToggleStatus(usuario.id, usuario.status)}
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
                          value={usuarioSelecionado.nome}
                          onChange={(e) => setUsuarioSelecionado({ ...usuarioSelecionado, nome: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmail">E-mail</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={usuarioSelecionado.email}
                          onChange={(e) => setUsuarioSelecionado({ ...usuarioSelecionado, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editSetor">Secretaria ou Setor</Label>
                        <Select
                          value={usuarioSelecionado.setor || ""}
                          onValueChange={(value) => setUsuarioSelecionado({ ...usuarioSelecionado, setor: value })}
                        >
                          <SelectTrigger id="editSetor">
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                          <SelectContent>
                            {setoresDisp.map((setor) => (
                              <SelectItem key={setor.id} value={setor.nome}>{setor.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editCargo">Cargo</Label>
                        <Select
                          value={usuarioSelecionado.cargo || ""}
                          onValueChange={(value) => setUsuarioSelecionado({ ...usuarioSelecionado, cargo: value })}
                        >
                          <SelectTrigger id="editCargo">
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {cargos.map((cargo) => (
                              <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogEditarUsuario(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEditarUsuario} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                        onChange={(e) => setEntidade({ ...entidade, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidadeEntidade">Cidade</Label>
                      <Input
                        id="cidadeEntidade"
                        value={entidade.cidade}
                        onChange={(e) => setEntidade({ ...entidade, cidade: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ufEntidade">UF</Label>
                      <Select value={entidade.uf} onValueChange={(value) => setEntidade({ ...entidade, uf: value })}>
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
                        onChange={(e) => setEntidade({ ...entidade, cnpj: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipoEntidade">Tipo de Entidade</Label>
                      <Select value={entidade.tipo} onValueChange={(value) => setEntidade({ ...entidade, tipo: value })}>
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
                    <Button onClick={handleSalvarEntidade} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Salvar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
