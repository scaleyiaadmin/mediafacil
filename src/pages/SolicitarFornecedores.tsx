import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, MapPin, Briefcase, Mail, Info } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ufs, segmentos } from "@/data/regioes";
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
  const { profile } = useAuth();

  const state = location.state as { orcamentoId?: string, itens?: any[], entidade?: string, responsavel?: string, nomeOrcamento?: string } | undefined;

  const [segmento, setSegmento] = useState("");
  const [abrangencia, setAbrangencia] = useState<"brasil" | "ufs">("brasil");
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchFornecedores();
    }
  }, [profile]);

  async function fetchFornecedores() {
    try {
      setLoading(true);
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
      let matchesLocalizacao = true;
      if (abrangencia === "ufs" && ufsSelecionadas.length > 0) {
        matchesLocalizacao = ufsSelecionadas.includes(f.uf);
      }
      return matchesSegmento && matchesLocalizacao;
    });
  }, [fornecedores, segmento, abrangencia, ufsSelecionadas]);

  const toggleUf = (uf: string) => {
    setUfsSelecionadas((prev) =>
      prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf]
    );
  };

  const handleEnviar = async () => {
    if (fornecedoresFiltrados.length === 0) {
      toast.error("Nenhum fornecedor encontrado para os critérios selecionados.");
      return;
    }

    setLoading(true);
    try {
      let orcamentoId = state?.orcamentoId;

      if (!orcamentoId) {
        const orc = await createOrcamento(
          state?.nomeOrcamento || "Novo Orçamento",
          state?.itens || [],
          [],
          "waiting_suppliers"
        );
        orcamentoId = orc.id;
      } else {
        await supabase
          .from('orcamentos')
          .update({ status: 'waiting_suppliers' })
          .eq('id', orcamentoId);
      }

      const fornecedoresToInsert = fornecedoresFiltrados.map(f => ({
        orcamento_id: orcamentoId,
        fornecedor_id: f.id,
        status: 'pending'
      }));

      await supabase.from('orcamento_fornecedores').delete().eq('orcamento_id', orcamentoId);

      const { error: insertErr } = await supabase
        .from('orcamento_fornecedores')
        .insert(fornecedoresToInsert);

      if (insertErr) throw insertErr;

      const { data: relations, error: relError } = await supabase
        .from('orcamento_fornecedores')
        .select('*, fornecedores(razao_social, email)')
        .eq('orcamento_id', orcamentoId);

      if (relError) throw relError;

      const emailsPromises = (relations || []).map(async (rel: any) => {
        const emailDestino = rel.fornecedores.email || "fornecedor@exemplo.com.br";
        const token = rel.token;
        const linkProposta = `${window.location.origin}/proposta/${token}`;

        const html = generateBudgetRequestHtml({
          fornecedorNome: rel.fornecedores.razao_social,
          responsavel: state?.responsavel || profile?.nome || "Gestor de Compras",
          entidade: state?.entidade || "Prefeitura Municipal",
          itens: state?.itens || [],
          orcamentoNome: state?.nomeOrcamento,
          linkProposta: linkProposta
        });

        return sendEmail({
          to: emailDestino,
          subject: `Solicitação de Orçamento - ${state?.entidade || 'Média Fácil'}`,
          html
        });
      });

      await Promise.all(emailsPromises);

      toast.success(`${fornecedoresFiltrados.length} solicitações enviadas com sucesso!`);
      navigate("/orcamentos");
    } catch (error: any) {
      console.error("Erro ao processar solicitações:", error);
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Configure o envio de cotações" subtitle="Defina os parâmetros para envio automático">
      <div className="mx-auto max-w-3xl space-y-6 pb-12">

        {/* Como funciona? */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6 flex gap-4">
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-blue-900 text-sm">Como funciona?</h4>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Os fornecedores cadastrados no sistema receberão um link por e-mail para responder à sua solicitação de orçamento.
              As respostas serão computadas automaticamente no seu orçamento.
            </p>
          </div>
        </div>

        {/* Segmento do Fornecedor */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Segmento do Fornecedor</h4>
              <p className="text-sm text-muted-foreground">Escolha o segmento de atuação dos fornecedores</p>
            </div>
          </div>

          <Select value={segmento} onValueChange={setSegmento}>
            <SelectTrigger className="h-12 border-orange-200 focus:ring-orange-500">
              <SelectValue placeholder="Selecione um segmento" />
            </SelectTrigger>
            <SelectContent>
              {segmentos.map((seg) => (
                <SelectItem key={seg} value={seg}>
                  {seg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Localização */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Localização</h4>
              <p className="text-sm text-muted-foreground">Defina a região dos fornecedores</p>
            </div>
          </div>

          <RadioGroup
            value={abrangencia}
            onValueChange={(v) => setAbrangencia(v as "brasil" | "ufs")}
            className="space-y-3"
          >
            <div className={`flex items-center space-x-3 rounded-xl border p-4 transition-all ${abrangencia === 'brasil' ? 'border-orange-500 bg-orange-50/10' : 'border-border'}`}>
              <RadioGroupItem value="brasil" id="brasil" className="text-orange-600 border-orange-500" />
              <Label htmlFor="brasil" className="font-bold cursor-pointer flex-1">Todo o Brasil</Label>
            </div>

            <div className={`flex items-center space-x-3 rounded-xl border p-4 transition-all ${abrangencia === 'ufs' ? 'border-orange-500 bg-orange-50/10' : 'border-border'}`}>
              <RadioGroupItem value="ufs" id="ufs" className="text-orange-600 border-orange-500" />
              <Label htmlFor="ufs" className="font-bold cursor-pointer flex-1">Selecionar Estados</Label>
            </div>
          </RadioGroup>

          {abrangencia === "ufs" && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Estados</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {ufs.map((uf) => (
                  <button
                    key={uf}
                    onClick={() => toggleUf(uf)}
                    className={`h-9 rounded-lg text-xs font-bold border transition-all ${ufsSelecionadas.includes(uf)
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-muted/50 hover:bg-muted border-transparent text-muted-foreground"
                      }`}
                  >
                    {uf}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumo do E-mail */}
        <div className="rounded-xl border border-border bg-muted/20 p-6 flex gap-4">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-sm opacity-80">Os fornecedores receberão um e-mail com:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 mt-2 font-medium">
              <li className="flex items-center gap-2">• Lista de itens para cotação</li>
              <li className="flex items-center gap-2">• Prazo para resposta</li>
              <li className="flex items-center gap-2">• Link para enviar os preços</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-12 px-8 font-bold"
          >
            Voltar
          </Button>
          <Button
            onClick={handleEnviar}
            className="h-12 px-8 gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold"
            disabled={loading || !segmento || (abrangencia === 'ufs' && ufsSelecionadas.length === 0)}
          >
            {loading ? <span className="animate-spin mr-2 text-white">◌</span> : <Send className="h-4 w-4" />}
            Enviar solicitações de orçamento
          </Button>
        </div>

      </div>
    </MainLayout>
  );
}
