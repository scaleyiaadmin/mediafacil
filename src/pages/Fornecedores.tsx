import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, Filter, Building2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ufs, regioesPorUF, segmentos } from "@/data/regioes";

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

const fornecedoresMock: Fornecedor[] = [
  {
    id: "1",
    cnpj: "12.345.678/0001-90",
    razaoSocial: "Papelaria Central Ltda",
    cidade: "São Paulo",
    uf: "SP",
    regiao: "Grande São Paulo",
    email: "contato@papelariacentral.com.br",
    telefone: "(11) 3456-7890",
    segmentos: ["Material de Escritório"],
  },
  {
    id: "2",
    cnpj: "98.765.432/0001-10",
    razaoSocial: "TechSupply Informática",
    cidade: "Campinas",
    uf: "SP",
    regiao: "Campinas",
    email: "vendas@techsupply.com.br",
    telefone: "(19) 3333-4444",
    segmentos: ["Equipamentos de Informática", "Serviços de TI"],
  },
  {
    id: "3",
    cnpj: "11.222.333/0001-44",
    razaoSocial: "Móveis Escolares Brasil",
    cidade: "Belo Horizonte",
    uf: "MG",
    regiao: "Grande BH",
    email: "comercial@moveisbrasil.com.br",
    telefone: "(31) 2222-1111",
    segmentos: ["Mobiliário"],
  },
  {
    id: "4",
    cnpj: "55.666.777/0001-88",
    razaoSocial: "Distribuidora Limpeza Total",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    regiao: "Metropolitana do Rio",
    email: "pedidos@limpezatotal.com.br",
    telefone: "(21) 5555-6666",
    segmentos: ["Material de Limpeza", "EPIs"],
  },
  {
    id: "5",
    cnpj: "33.444.555/0001-22",
    razaoSocial: "Farmácia Atacado Saúde",
    cidade: "Curitiba",
    uf: "PR",
    regiao: "Metropolitana de Curitiba",
    email: "atacado@farmaciadistribuidora.com.br",
    telefone: "(41) 7777-8888",
    segmentos: ["Medicamentos"],
  },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [ufFilter, setUfFilter] = useState("all");
  const [regiaoFilter, setRegiaoFilter] = useState("all");
  const [segmentoFilter, setSegmentoFilter] = useState("all");
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(fornecedoresMock);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleSubmit = () => {
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

    // Add new fornecedor
    const newFornecedor: Fornecedor = {
      id: String(Date.now()),
      ...formData,
    };

    setFornecedores((prev) => [...prev, newFornecedor]);
    toast.success("Fornecedor cadastrado com sucesso!");
    setDialogOpen(false);
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

  return (
    <MainLayout title="Fornecedores" subtitle="Gerencie os fornecedores cadastrados">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Fornecedor
              </Button>
            </DialogTrigger>
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
                <Button onClick={handleSubmit}>Cadastrar</Button>
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
