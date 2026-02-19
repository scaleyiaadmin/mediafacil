import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Send, MapPin, Briefcase, Mail, Info } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ufs, regioesPorUF, segmentos } from "@/data/regioes";
import { toast } from "sonner";

export default function SolicitarFornecedores() {
  const [segmento, setSegmento] = useState("");
  const [abrangencia, setAbrangencia] = useState<"brasil" | "ufs">("brasil");
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>([]);
  const [regioesSelecionadas, setRegioesSelecionadas] = useState<string[]>([]);

  const regioesDisponiveis = useMemo(() => {
    const regioes: string[] = [];
    ufsSelecionadas.forEach((uf) => {
      const ufsRegioes = regioesPorUF[uf];
      if (ufsRegioes) {
        regioes.push(...ufsRegioes.map((r) => `${uf}:${r}`));
      }
    });
    return regioes;
  }, [ufsSelecionadas]);

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

  const handleEnviar = () => {
    if (!segmento) {
      toast.error("Selecione um segmento");
      return;
    }
    toast.success("Solicitações enviadas com sucesso!");
  };

  return (
    <MainLayout title="Solicitar Orçamento a Fornecedores" subtitle="Configure o envio de cotações">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Info box */}
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 p-4">
          <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Como funciona?</p>
            <p className="text-muted-foreground mt-1">
              Os fornecedores cadastrados no sistema receberão um link por e-mail para responder à sua solicitação de orçamento. 
              As respostas serão computadas automaticamente no seu orçamento.
            </p>
          </div>
        </div>

        {/* Segmento */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Segmento do Fornecedor</h2>
              <p className="text-sm text-muted-foreground">Escolha o segmento de atuação dos fornecedores</p>
            </div>
          </div>

          <Select value={segmento} onValueChange={setSegmento}>
            <SelectTrigger className="w-full">
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Localização</h2>
              <p className="text-sm text-muted-foreground">Defina a região dos fornecedores</p>
            </div>
          </div>

          <RadioGroup value={abrangencia} onValueChange={(v) => setAbrangencia(v as "brasil" | "ufs")}>
            <div className="space-y-3">
              <div 
                className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                  abrangencia === "brasil" ? "border-primary bg-accent/30" : "border-border"
                }`}
                onClick={() => setAbrangencia("brasil")}
              >
                <RadioGroupItem value="brasil" id="brasil" />
                <Label htmlFor="brasil" className="font-medium cursor-pointer">
                  Todo o Brasil
                </Label>
              </div>

              <div 
                className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                  abrangencia === "ufs" ? "border-primary bg-accent/30" : "border-border"
                }`}
                onClick={() => setAbrangencia("ufs")}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="ufs" id="ufs" />
                  <Label htmlFor="ufs" className="font-medium cursor-pointer">
                    Selecionar Estados
                  </Label>
                </div>

                {abrangencia === "ufs" && (
                  <div className="mt-4 space-y-4">
                    {/* UFs */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Estados</p>
                      <div className="flex flex-wrap gap-2">
                        {ufs.map((uf) => (
                          <button
                            key={uf}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUf(uf);
                            }}
                            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                              ufsSelecionadas.includes(uf)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {uf}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Regiões por UF selecionada */}
                    {ufsSelecionadas.length > 0 && (
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Regiões (opcional - deixe vazio para todas)
                        </p>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {ufsSelecionadas.map((uf) => {
                            const regioes = regioesPorUF[uf] || [];
                            if (regioes.length === 0) return null;
                            return (
                              <div key={uf} className="space-y-2">
                                <p className="text-xs font-semibold text-primary">{uf}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {regioes.map((regiao) => {
                                    const regiaoKey = `${uf}:${regiao}`;
                                    return (
                                      <div
                                        key={regiaoKey}
                                        className="flex items-center space-x-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Checkbox
                                          id={regiaoKey}
                                          checked={regioesSelecionadas.includes(regiaoKey)}
                                          onCheckedChange={(checked) =>
                                            handleRegiaoChange(regiaoKey, checked as boolean)
                                          }
                                        />
                                        <Label
                                          htmlFor={regiaoKey}
                                          className="text-xs font-normal cursor-pointer"
                                        >
                                          {regiao}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* E-mail preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Mail className="h-4 w-4" />
            <span>Os fornecedores receberão um e-mail com:</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Lista de itens para cotação</li>
            <li>• Prazo para resposta</li>
            <li>• Link para enviar os preços</li>
          </ul>
        </div>

        {/* Botão de ação */}
        <div className="flex justify-center gap-4 pt-4">
          <Link to="/resultado-busca">
            <Button variant="outline">Voltar</Button>
          </Link>
          <Link to="/orcamento/1">
            <Button className="gap-2" disabled={!segmento} onClick={handleEnviar}>
              <Send className="h-4 w-4" />
              Enviar solicitações de orçamento
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
