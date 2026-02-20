import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, Filter, Building2, Upload, Loader2, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ufs, regioesPorUF, segmentos } from "@/data/regioes";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Edit2 } from "lucide-react";

interface Fornecedor {
  id: string;
  cnpj: string;
  razaoSocial: string;
  cidade: string;
  uf: string;
  regiao: string;
  email: string;
  telefone: string;
  segmentos: string[];
}

const fornecedoresMock: Fornecedor[] = [];

function formatCNPJ(value: string) {
  const numbers = value.replace(/\D/g, "");
  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, "");
  return numbers.length === 14;
}

function formatPhone(value: string) {
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
}

export default function Fornecedores() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [ufFilter, setUfFilter] = useState("all");
  const [regiaoFilter, setRegiaoFilter] = useState("all");
  const [segmentoFilter, setSegmentoFilter] = useState("all");
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Auth check
  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/");
          return;
        }

        const { data: profile } = await supabase
          .from('usuarios')
          .select('tipo')
          .eq('email', user.email)
          .single();

        if (profile?.tipo === 'super_admin') {
          setIsSuperAdmin(true);
          fetchFornecedores();
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/");
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAccess();
  }, []);

  const fetchFornecedores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores.");
    } else {
      const mappedData: Fornecedor[] = (data || []).map((f: any) => ({
        id: f.id,
        cnpj: f.cnpj,
        razaoSocial: f.razao_social,
        cidade: f.cidade,
        uf: f.uf,
        regiao: f.regiao,
        email: f.email,
        telefone: f.telefone,
        segmentos: f.segmentos || [],
      }));
      setFornecedores(mappedData);
    }
    setLoading(false);
  };

  // Form state
  const [formData, setFormData] = useState({
    cnpj: "",
    razaoSocial: "",
    cidade: "",
    uf: "",
    regiao: "",
    email: "",
    telefone: "",
    segmentos: [] as string[],
  });

  const regioesDisponiveis = useMemo(() => {
    return ufFilter !== "all" ? regioesPorUF[ufFilter] || [] : [];
  }, [ufFilter]);

  const regioesFormDisponiveis = useMemo(() => {
    return formData.uf ? regioesPorUF[formData.uf] || [] : [];
  }, [formData.uf]);

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter((f) => {
      const matchesSearch =
        f.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cnpj.includes(searchTerm);
      const matchesUf = ufFilter === "all" || f.uf === ufFilter;
      const matchesRegiao = regiaoFilter === "all" || f.regiao === regiaoFilter;
      const matchesSegmento =
        segmentoFilter === "all" || f.segmentos.includes(segmentoFilter);
      return matchesSearch && matchesUf && matchesRegiao && matchesSegmento;
    });
  }, [fornecedores, searchTerm, ufFilter, regiaoFilter, segmentoFilter]);

  const handleSegmentoChange = (segmento: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      segmentos: checked
        ? [...prev.segmentos, segmento]
        : prev.segmentos.filter((s) => s !== segmento),
    }));
  };

  const handleSubmit = async () => {
    // Validations
    if (!validateCNPJ(formData.cnpj)) {
      toast.error("CNPJ inválido. Digite os 14 dígitos.");
      return;
    }

    const cnpjExists = fornecedores.some(
      (f) => f.cnpj.replace(/\D/g, "") === formData.cnpj.replace(/\D/g, "")
    );
    if (cnpjExists) {
      toast.error("CNPJ já cadastrado no sistema.");
      return;
    }

    if (!formData.razaoSocial.trim()) {
      toast.error("Razão Social é obrigatória.");
      return;
    }

    if (!formData.cidade.trim()) {
      toast.error("Cidade é obrigatória.");
      return;
    }

    if (!formData.uf) {
      toast.error("UF é obrigatória.");
      return;
    }

    if (!formData.regiao) {
      toast.error("Região é obrigatória.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("E-mail inválido.");
      return;
    }

    if (formData.telefone.replace(/\D/g, "").length < 10) {
      toast.error("Telefone inválido.");
      return;
    }

    if (formData.segmentos.length === 0) {
      toast.error("Selecione ao menos um segmento.");
      return;
    }

    // Add new fornecedor to Supabase
    const { data, error } = await supabase
      .from("fornecedores")
      .insert([
        {
          cnpj: formData.cnpj,
          razao_social: formData.razaoSocial,
          cidade: formData.cidade,
          uf: formData.uf,
          regiao: formData.regiao,
          email: formData.email,
          telefone: formData.telefone,
          segmentos: formData.segmentos,
        },
      ])
      .select();

    if (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar no banco de dados.");
      return;
    }

    if (data && data[0]) {
      const inserted = data[0];
      const newFornecedor: Fornecedor = {
        id: inserted.id,
        cnpj: inserted.cnpj,
        razaoSocial: inserted.razao_social,
        cidade: inserted.cidade,
        uf: inserted.uf,
        regiao: inserted.regiao,
        email: inserted.email,
        telefone: inserted.telefone,
        segmentos: inserted.segmentos || [],
      };
      setFornecedores((prev) => [newFornecedor, ...prev]);
      toast.success("Fornecedor cadastrado com sucesso!");
      setDialogOpen(false);
    }
    setFormData({
      cnpj: "",
      razaoSocial: "",
      cidade: "",
      uf: "",
      regiao: "",
      email: "",
      telefone: "",
      segmentos: [],
    });
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const suppliersToInsert = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(v => v.trim());
          const supplier: any = {};

          headers.forEach((header, index) => {
            if (header === 'cnpj') supplier.cnpj = values[index];
            if (header === 'razao_social' || header === 'razao social') supplier.razao_social = values[index];
            if (header === 'cidade') supplier.cidade = values[index];
            if (header === 'uf') supplier.uf = values[index];
            if (header === 'regiao') supplier.regiao = values[index];
            if (header === 'email') supplier.email = values[index];
            if (header === 'telefone') supplier.telefone = values[index];
            if (header === 'segmentos') supplier.segmentos = values[index]?.split(';').map(s => s.trim());
          });

          if (supplier.cnpj && supplier.razao_social) {
            suppliersToInsert.push(supplier);
          }
        }

        if (suppliersToInsert.length === 0) {
          toast.error("Nenhum fornecedor válido encontrado no CSV.");
          return;
        }

        setPreviewData(suppliersToInsert);
        setPreviewDialogOpen(true);
      } catch (error) {
        console.error("CSV Import Error:", error);
        toast.error("Erro ao importar CSV. Verifique o formato do arquivo.");
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from("fornecedores")
        .upsert(previewData, { onConflict: 'cnpj' });

      if (error) throw error;

      toast.success(`${previewData.length} fornecedores importados com sucesso!`);
      setPreviewDialogOpen(false);
      setPreviewData([]);
      fetchFornecedores();
    } catch (error) {
      console.error("Bulk Save Error:", error);
      toast.error("Erro ao salvar fornecedores.");
    } finally {
      setUploading(false);
    }
  };

  const removeItemFromPreview = (index: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
  };

  const editItemInPreview = (index: number) => {
    const item = previewData[index];
    setFormData({
      cnpj: item.cnpj || "",
      razaoSocial: item.razao_social || "",
      cidade: item.cidade || "",
      uf: item.uf || "",
      regiao: item.regiao || "",
      email: item.email || "",
      telefone: item.telefone || "",
      segmentos: item.segmentos || [],
    });
    setEditingIndex(index);
    setPreviewDialogOpen(false);
    setDialogOpen(true);
  };

  // Modify handleSubmit to handle preview editing
  const originalHandleSubmit = handleSubmit;
  const upgradedHandleSubmit = async () => {
    if (editingIndex !== null) {
      // Re-validate just in case
      if (!validateCNPJ(formData.cnpj)) {
        toast.error("CNPJ inválido.");
        return;
      }

      const updatedItem = {
        cnpj: formData.cnpj,
        razao_social: formData.razaoSocial,
        cidade: formData.cidade,
        uf: formData.uf,
        regiao: formData.regiao,
        email: formData.email,
        telefone: formData.telefone,
        segmentos: formData.segmentos,
      };

      const newData = [...previewData];
      newData[editingIndex] = updatedItem;
      setPreviewData(newData);
      setEditingIndex(null);
      setDialogOpen(false);
      setPreviewDialogOpen(true);

      // Reset form
      setFormData({
        cnpj: "",
        razaoSocial: "",
        cidade: "",
        uf: "",
        regiao: "",
        email: "",
        telefone: "",
        segmentos: [],
      });
      return;
    }

    await originalHandleSubmit();
  };

  if (checkingAuth) {
    return (
      <MainLayout title="Fornecedores" subtitle="Carregando...">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <MainLayout title="Fornecedores" subtitle="Acesso restrito">
        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground max-w-md">
            Apenas administradores do sistema (Super Admin) têm permissão para gerenciar a base global de fornecedores.
          </p>
          <Button onClick={() => navigate("/")}>Voltar para o Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Fornecedores" subtitle="Gerencie os fornecedores cadastrados">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="file"
                  id="csv-upload"
                  className="hidden"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Importar CSV
                </Button>
              </div>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => {
                  setEditingIndex(null);
                  setFormData({
                    cnpj: "",
                    razaoSocial: "",
                    cidade: "",
                    uf: "",
                    regiao: "",
                    email: "",
                    telefone: "",
                    segmentos: [],
                  });
                }}>
                  <Plus className="h-4 w-4" />
                  Cadastrar Fornecedor
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
                <DialogDescription>
                  Preencha os dados do fornecedor. Todos os campos são obrigatórios.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cnpj: formatCNPJ(e.target.value),
                        }))
                      }
                      maxLength={18}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razaoSocial">Razão Social</Label>
                    <Input
                      id="razaoSocial"
                      placeholder="Nome da empresa"
                      value={formData.razaoSocial}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          razaoSocial: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cidade: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Select
                      value={formData.uf}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          uf: value,
                          regiao: "",
                        }))
                      }
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
                    <Label htmlFor="regiao">Região</Label>
                    <Select
                      value={formData.regiao}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, regiao: value }))
                      }
                      disabled={!formData.uf}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {regioesFormDisponiveis.map((regiao) => (
                          <SelectItem key={regiao} value={regiao}>
                            {regiao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com.br"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          telefone: formatPhone(e.target.value),
                        }))
                      }
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Segmentos Atendidos</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-border bg-muted/20">
                    {segmentos.map((segmento) => (
                      <div key={segmento} className="flex items-center space-x-2">
                        <Checkbox
                          id={segmento}
                          checked={formData.segmentos.includes(segmento)}
                          onCheckedChange={(checked) =>
                            handleSegmentoChange(segmento, checked as boolean)
                          }
                        />
                        <Label htmlFor={segmento} className="text-sm font-normal">
                          {segmento}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={upgradedHandleSubmit}>
                  {editingIndex !== null ? "Salvar Alteração" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Import Preview Dialog */}
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Revisar Importação</DialogTitle>
                <DialogDescription>
                  Verifique os dados extraídos do CSV. Você pode editar ou remover itens antes de confirmar.
                  <br />
                  <strong>{previewData.length} fornecedores</strong> prontos para inclusão.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-auto my-4 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium whitespace-nowrap">{item.cnpj}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.razao_social}</TableCell>
                        <TableCell>{item.cidade}/{item.uf}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{item.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => editItemInPreview(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeItemFromPreview(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => {
                  setPreviewDialogOpen(false);
                  setPreviewData([]);
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmImport} disabled={uploading || previewData.length === 0}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    `Confirmar Importação (${previewData.length})`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              className="pl-9 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={segmentoFilter} onValueChange={setSegmentoFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Segmentos</SelectItem>
              {segmentos.map((seg) => (
                <SelectItem key={seg} value={seg}>
                  {seg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ufFilter}
            onValueChange={(value) => {
              setUfFilter(value);
              setRegiaoFilter("all");
            }}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas UFs</SelectItem>
              {ufs.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={regiaoFilter}
            onValueChange={setRegiaoFilter}
            disabled={ufFilter === "all"}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Regiões</SelectItem>
              {regioesDisponiveis.map((regiao) => (
                <SelectItem key={regiao} value={regiao}>
                  {regiao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de fornecedores */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {filteredFornecedores.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum fornecedor encontrado</p>
              </div>
            ) : (
              filteredFornecedores.map((fornecedor) => (
                <div
                  key={fornecedor.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {fornecedor.razaoSocial}
                      </p>
                      <p className="text-sm text-muted-foreground">{fornecedor.cnpj}</p>
                      <p className="text-sm text-muted-foreground">
                        {fornecedor.cidade}/{fornecedor.uf} - {fornecedor.regiao}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <p className="text-sm text-muted-foreground">{fornecedor.email}</p>
                    <p className="text-sm text-muted-foreground">{fornecedor.telefone}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {fornecedor.segmentos.slice(0, 2).map((seg) => (
                        <span
                          key={seg}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {seg}
                        </span>
                      ))}
                      {fornecedor.segmentos.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{fornecedor.segmentos.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
