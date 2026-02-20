import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Database } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const fontes = [
  { id: "pncp", nome: "PNCP", descricao: "Portal Nacional de Contratações Públicas" },
  { id: "bps", nome: "BPS", descricao: "Banco de Preços em Saúde" },
  { id: "painel", nome: "Painel de Preços", descricao: "Painel de Preços do Governo Federal" },
  { id: "nfe", nome: "NFe", descricao: "Notas Fiscais Eletrônicas" },
];

const ufs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function ConfigurarBusca() {
  const [fontesSelecionadas, setFontesSelecionadas] = useState<string[]>(["pncp", "bps"]);
  const [abrangencia, setAbrangencia] = useState<"brasil" | "ufs">("brasil");
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>([]);

  const toggleFonte = (fonteId: string) => {
    setFontesSelecionadas(prev =>
      prev.includes(fonteId)
        ? prev.filter(id => id !== fonteId)
        : [...prev, fonteId]
    );
  };

  const toggleUf = (uf: string) => {
    setUfsSelecionadas(prev =>
      prev.includes(uf)
        ? prev.filter(u => u !== uf)
        : [...prev, uf]
    );
  };

  return (
    <MainLayout title="Configurar Busca Automática" subtitle="Defina as fontes e a abrangência geográfica">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Fontes de dados */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Fontes de Dados</h2>
              <p className="text-sm text-muted-foreground">Selecione de onde buscar os preços</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fontes.map((fonte) => (
              <div
                key={fonte.id}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${fontesSelecionadas.includes(fonte.id)
                    ? "border-primary bg-accent/30"
                    : "border-border hover:border-border/80"
                  }`}
                onClick={() => toggleFonte(fonte.id)}
              >
                <Checkbox
                  id={fonte.id}
                  checked={fontesSelecionadas.includes(fonte.id)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor={fonte.id} className="font-medium cursor-pointer">
                    {fonte.nome}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{fonte.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abrangência geográfica */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Abrangência Geográfica</h2>
              <p className="text-sm text-muted-foreground">Defina a região para buscar os preços</p>
            </div>
          </div>

          <RadioGroup value={abrangencia} onValueChange={(v) => setAbrangencia(v as "brasil" | "ufs")}>
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${abrangencia === "brasil" ? "border-primary bg-accent/30" : "border-border"
                  }`}
                onClick={() => setAbrangencia("brasil")}
              >
                <RadioGroupItem value="brasil" id="brasil" />
                <Label htmlFor="brasil" className="font-medium cursor-pointer">
                  Todo o Brasil
                </Label>
              </div>

              <div
                className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${abrangencia === "ufs" ? "border-primary bg-accent/30" : "border-border"
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ufs.map((uf) => (
                      <button
                        key={uf}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUf(uf);
                        }}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors ${ufsSelecionadas.includes(uf)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/50"
                          }`}
                      >
                        {uf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Botão de ação */}
        <div className="flex justify-center pt-4">
          <Link to="/resultado-busca">
            <Button size="lg" className="gap-2" disabled={fontesSelecionadas.length === 0}>
              <Search className="h-5 w-5" />
              Buscar preços automaticamente
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
