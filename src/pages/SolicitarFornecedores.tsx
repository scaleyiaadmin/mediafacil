import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Send, MapPin, Briefcase, Mail, Info, Check, Building2, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ufs, regioesPorUF, segmentos } from "@/data/regioes";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { sendEmail, generateBudgetRequestHtml } from "@/lib/email";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { useAuth } from "@/contexts/AuthContext";

interface Fornecedor {
  id: string;
  cnpj: string;
  razao_social: string;
  cidade: string;
  uf: string;
  regiao: string;
  segmentos: string[];
}

export default function SolicitarFornecedores() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createOrcamento } = useOrcamentos();
  const state = location.state as { itens?: any[], entidade?: string, responsavel?: string, nomeOrcamento?: string, id?: string } | undefined;

  const [segmento, setSegmento] = useState("");
  const [abrangencia, setAbrangencia] = useState<"brasil" | "ufs">("brasil");
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>([]);
  const [regioesSelecionadas, setRegioesSelecionadas] = useState<string[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchFornecedores();
    }
  }, [profile]);

  async function fetchFornecedores() {
    try {
      setLoading(true);
      // Busca fornecedores específicos da entidade OU globais (onde entidade_id é nulo)
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .or(`entidade_id.eq.${profile?.entidade_id},entidade_id.is.null`);

      if (error) throw error;
      if (data) setFornecedores(data);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      const matchesSegmento = !segmento || f.segmentos.includes(segmento);
      const matchesSearch = !searchTerm || f.razao_social.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesLocalizacao = true;
      if (abrangencia === "ufs" && ufsSelecionadas.length > 0) {
        matchesLocalizacao = ufsSelecionadas.includes(f.uf);
        if (matchesLocalizacao && regioesSelecionadas.length > 0) {
          // Lógica simplificada: se tem região selecionada para a UF, verifica se bate
          // Se a região do fornecedor estiver nas selecionadas (formato UF:Regiao)
          const fornecedorRegiaoKey = `${f.uf}:${f.regiao}`;
          // Se houver regioes selecionadas para ESTA UF, o fornecedor deve dar match
          const regioesDestaUF = regioesSelecionadas.filter(r => r.startsWith(`${f.uf}:`));
          if (regioesDestaUF.length > 0) {
            matchesLocalizacao = regioesSelecionadas.includes(fornecedorRegiaoKey);
          }
        }
      }

      return matchesSegmento && matchesSearch && matchesLocalizacao;
    });
  }, [fornecedores, segmento, searchTerm, abrangencia, ufsSelecionadas, regioesSelecionadas]);

  const toggleFornecedor = (id: string) => {
    setFornecedoresSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    if (fornecedoresSelecionados.length === fornecedoresFiltrados.length) {
      setFornecedoresSelecionados([]);
    } else {
      setFornecedoresSelecionados(fornecedoresFiltrados.map((f) => f.id));
    }
  };

  const toggleUf = (uf: string) => {
    setUfsSelecionadas((prev) => {
      const newUfs = prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf];
      // Limpar regiões da UF removida
      if (!newUfs.includes(uf)) {
        setRegioesSelecionadas((prevRegioes) =>
          prevRegioes.filter((r) => !r.startsWith(`${uf}:`))
        );
      }
      return newUfs;
    });
  };

  const handleRegiaoChange = (regiaoKey: string, checked: boolean) => {
    setRegioesSelecionadas((prev) =>
      checked ? [...prev, regiaoKey] : prev.filter((r) => r !== regiaoKey)
    );
  };

  const handleEnviar = async () => {
    if (fornecedoresSelecionados.length === 0) {
      toast.error("Selecione pelo menos um fornecedor.");
      return;
    }

    setLoading(true);
    const fornecedoresEscolhidos = fornecedores.filter(f => fornecedoresSelecionados.includes(f.id));

    try {
      // 1. Create or Update Orcamento in DB
      const orcamento = await createOrcamento(
        state?.nomeOrcamento || "Novo Orçamento",
        state?.itens || [],
        fornecedoresEscolhidos,
        "waiting_suppliers"
      );

      // 2. Fetch the Orcamento-Fornecedor relations to get the generated TOKENS
      const { data: relations, error: relError } = await supabase
        .from('orcamento_fornecedores')
        .select('*, fornecedores(razao_social, email)')
        .eq('orcamento_id', orcamento.id);

      if (relError) throw relError;

      // 3. Send Emails with the unique tokens
      const emailsPromises = (relations || []).map(async (rel: any) => {
        const emailDestino = rel.fornecedores.email || "fornecedor@exemplo.com.br";
        const token = rel.token;
        // In a real production app, this would be the actual public URL
        const linkProposta = `${window.location.origin}/proposta/${token}`;

        const html = generateBudgetRequestHtml({
          fornecedorNome: rel.fornecedores.razao_social,
          responsavel: state?.responsavel || "Gestor de Compras",
          entidade: state?.entidade || "Prefeitura Municipal",
          itens: state?.itens || [],
          orcamentoNome: state?.nomeOrcamento,
          linkProposta: linkProposta // Pass the link to the email template
        });

        return sendEmail({
          to: emailDestino,
          subject: `Solicitação de Orçamento - ${state?.entidade || 'Média Fácil'}`,
          html
        });
      });

      await Promise.all(emailsPromises);

      toast.success(`${fornecedoresSelecionados.length} solicitações enviadas com sucesso!`);

      // Navegar para o relatório final
      navigate("/relatorio-final", {
        state: {
          ...state,
          fornecedores: fornecedoresEscolhidos,
          orcamentoId: orcamento.id
        }
      });
    } catch (error: any) {
      console.error("Erro ao processar solicitações:", error);
      toast.error("Erro ao enviar solicitações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Solicitar Orçamento" subtitle="Selecione os fornecedores para envio">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Filtros */}
        <div className="grid gap-6 md:grid-cols-2 rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <Label>Segmento</Label>
            </div>
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {segmentos.map((seg) => (
                  <SelectItem key={seg} value={seg}>
                    {seg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <Label>Localização</Label>
            </div>
            <RadioGroup value={abrangencia} onValueChange={(v) => setAbrangencia(v as "brasil" | "ufs")} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brasil" id="brasil" />
                <Label htmlFor="brasil">Brasil</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ufs" id="ufs" />
                <Label htmlFor="ufs">Estados</Label>
              </div>
            </RadioGroup>

            {abrangencia === "ufs" && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
                <div className="flex flex-wrap gap-2">
                  {ufs.map((uf) => (
                    <button
                      key={uf}
                      onClick={() => toggleUf(uf)}
                      className={`px-2 py-1 text-xs rounded border ${ufsSelecionadas.includes(uf)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80"
                        }`}
                    >
                      {uf}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Seleção */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedores Encontrados ({fornecedoresFiltrados.length})
            </h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-3 border-b bg-muted/30 flex items-center gap-3">
              <Checkbox
                checked={fornecedoresSelecionados.length > 0 && fornecedoresSelecionados.length === fornecedoresFiltrados.length}
                onCheckedChange={toggleTodos}
              />
              <span className="text-sm font-medium">Selecionar Todos</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {fornecedoresSelecionados.length} selecionados
              </span>
            </div>

            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {fornecedoresFiltrados.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum fornecedor encontrado com os filtros atuais.
                </div>
              ) : (
                fornecedoresFiltrados.map(f => (
                  <div key={f.id} className="p-4 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                    <Checkbox
                      checked={fornecedoresSelecionados.includes(f.id)}
                      onCheckedChange={() => toggleFornecedor(f.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-foreground">{f.razao_social}</p>
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{f.uf}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{f.cidade} • {f.segmentos.join(", ")}</p>
                      <p className="text-xs text-muted-foreground mt-1">CNPJ: {f.cnpj}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
          <Button onClick={handleEnviar} className="gap-2" disabled={fornecedoresSelecionados.length === 0}>
            <Send className="h-4 w-4" />
            Enviar Cotação para {fornecedoresSelecionados.length} Fornecedores
          </Button>
        </div>

      </div>
    </MainLayout>
  );
}
