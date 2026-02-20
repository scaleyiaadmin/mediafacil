import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, MapPin, Database } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const fontes = [
  { id: "pncp", nome: "PNCP", descricao: "Portal Nacional de Contratações Públicas" },
  { id: "bps", nome: "BPS", descricao: "Banco de Preços em Saúde" },
  { id: "cmed", nome: "CMED", descricao: "Medicamentos" },
  { id: "sinapi", nome: "SINAPI", descricao: "Construção Civil" },
  { id: "setop", nome: "SETOP", descricao: "Obras Públicas", emBreve: true },
  { id: "ceasa", nome: "CEASA", descricao: "Hortifruti", emBreve: true },
  { id: "nfe", nome: "BANCO DE NFe", descricao: "Notas Fiscais Eletrônicas" },
];

const ufs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function ConfigurarBusca() {
  const location = useLocation();
  const itensSelecionados = location.state?.itensSelecionados || [];
  const nomeOrcamento = location.state?.nomeOrcamento || "Novo Orçamento";

  const [fontesSelecionadas, setFontesSelecionadas] = useState<string[]>(["pncp", "bps", "cmed", "sinapi"]);
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
    <MainLayout title="Configurar Busca" subtitle={`Defina as fontes para: ${nomeOrcamento}`}>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Fontes de dados */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Fontes de Dados</h2>
              <p className="text-sm text-muted-foreground">Selecione de onde buscar os preços complementares</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fontes.map((fonte) => (
              <div
                key={fonte.id}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all relative ${fonte.emBreve ? "opacity-60 cursor-not-allowed border-muted" :
                    fontesSelecionadas.includes(fonte.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                onClick={() => !fonte.emBreve && toggleFonte(fonte.id)}
              >
                <Checkbox
                  id={fonte.id}
                  checked={fontesSelecionadas.includes(fonte.id)}
                  disabled={fonte.emBreve}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor={fonte.id} className="font-bold cursor-pointer text-base">
                    {fonte.nome}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{fonte.descricao}</p>
                </div>
                {fonte.emBreve && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-100 text-[9px] font-black text-amber-700 uppercase tracking-tighter">
                    Em breve
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Abrangência geográfica */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Abrangência Geográfica</h2>
              <p className="text-sm text-muted-foreground">Defina a região para filtrar os resultados do PNCP</p>
            </div>
          </div>

          <RadioGroup value={abrangencia} onValueChange={(v) => setAbrangencia(v as "brasil" | "ufs")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className={`flex items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all ${abrangencia === "brasil" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-border/80"
                  }`}
                onClick={() => setAbrangencia("brasil")}
              >
                <RadioGroupItem value="brasil" id="brasil" />
                <Label htmlFor="brasil" className="font-bold text-base cursor-pointer">
                  Todo o Brasil
                </Label>
              </div>

              <div
                className={`rounded-xl border-2 p-5 cursor-pointer transition-all ${abrangencia === "ufs" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-border/80"
                  }`}
                onClick={() => setAbrangencia("ufs")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <RadioGroupItem value="ufs" id="ufs" />
                  <Label htmlFor="ufs" className="font-bold text-base cursor-pointer">
                    Selecionar Estados
                  </Label>
                </div>

                {abrangencia === "ufs" && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {ufs.map((uf) => (
                      <button
                        key={uf}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUf(uf);
                        }}
                        className={`w-9 h-8 text-[11px] font-bold rounded shadow-sm border transition-all ${ufsSelecionadas.includes(uf)
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-muted-foreground border-border hover:border-primary/50"
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
        <div className="flex justify-center pt-6">
          <Link to="/resultado-busca" state={{ itensSelecionados, nomeOrcamento, fontesSelecionadas, ufsSelecionadas }}>
            <Button size="lg" className="gap-3 h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20" disabled={fontesSelecionadas.length === 0}>
              <Search className="h-6 w-6" />
              Consolidar Preços de Mercado
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
