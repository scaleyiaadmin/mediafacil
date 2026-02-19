import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Minus, ArrowRight, ArrowLeft, Save, Database, MapPin } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ufs } from "@/data/regioes";
import { cn } from "@/lib/utils";

interface ItemDisponivel {
  id: string;
  nome: string;
  unidade: string;
  fonte: string;
  preco: number;
}

interface ItemSelecionado extends ItemDisponivel {
  quantidade: number;
}

const fontes = [
  { id: "pncp", nome: "PNCP", descricao: "Portal Nacional de Contratações Públicas" },
  { id: "bps", nome: "BPS", descricao: "Banco de Preços em Saúde" },
  { id: "painel", nome: "Painel de Preços", descricao: "Painel de Preços do Governo Federal" },
  { id: "nfe", nome: "NFe", descricao: "Notas Fiscais Eletrônicas" },
];

// Mock items database
const itensBanco: ItemDisponivel[] = [
  { id: "1", nome: "Caneta esferográfica azul", unidade: "unidade", fonte: "PNCP", preco: 1.25 },
  { id: "2", nome: "Caneta esferográfica preta", unidade: "unidade", fonte: "PNCP", preco: 1.30 },
  { id: "3", nome: "Papel A4 75g 500 folhas", unidade: "resma", fonte: "Painel de Preços", preco: 22.50 },
  { id: "4", nome: "Papel A4 90g 500 folhas", unidade: "resma", fonte: "PNCP", preco: 28.00 },
  { id: "5", nome: "Grampeador médio 26/6", unidade: "unidade", fonte: "BPS", preco: 18.90 },
  { id: "6", nome: "Clips nº 2/0 galvanizado", unidade: "caixa", fonte: "NFe", preco: 3.50 },
  { id: "7", nome: "Pasta suspensa kraft", unidade: "unidade", fonte: "PNCP", preco: 2.80 },
  { id: "8", nome: "Envelope ofício branco", unidade: "unidade", fonte: "Painel de Preços", preco: 0.35 },
  { id: "9", nome: "Calculadora de mesa 12 dígitos", unidade: "unidade", fonte: "PNCP", preco: 45.00 },
  { id: "10", nome: "Régua 30cm acrílico", unidade: "unidade", fonte: "NFe", preco: 4.20 },
  { id: "11", nome: "Borracha branca macia", unidade: "unidade", fonte: "BPS", preco: 1.00 },
  { id: "12", nome: "Lápis preto nº 2", unidade: "unidade", fonte: "PNCP", preco: 0.80 },
  { id: "13", nome: "Tesoura escolar", unidade: "unidade", fonte: "Painel de Preços", preco: 8.50 },
  { id: "14", nome: "Cola branca 90g", unidade: "unidade", fonte: "NFe", preco: 5.60 },
  { id: "15", nome: "Fita adesiva transparente", unidade: "rolo", fonte: "PNCP", preco: 3.90 },
];

export default function BuscarItensManual() {
  const navigate = useNavigate();
  const location = useLocation();
  const nomeOrcamento = location.state?.nomeOrcamento || "Novo Orçamento";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<ItemSelecionado[]>([]);
  
  // Filtros
  const [fontesSelecionadas, setFontesSelecionadas] = useState<string[]>(["pncp", "bps", "painel", "nfe"]);
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>([]);

  // Filtrar itens baseado na busca e fontes selecionadas
  const itensDisponiveis = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const fontesNomes = fontesSelecionadas.map((id) => {
      const fonte = fontes.find((f) => f.id === id);
      return fonte?.nome || "";
    });

    return itensBanco.filter((item) => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFonte = fontesNomes.includes(item.fonte);
      return matchesSearch && matchesFonte;
    });
  }, [searchTerm, fontesSelecionadas]);

  const handleFonteChange = (fonteId: string, checked: boolean) => {
    setFontesSelecionadas((prev) =>
      checked ? [...prev, fonteId] : prev.filter((id) => id !== fonteId)
    );
  };

  const handleUfChange = (uf: string, checked: boolean) => {
    setUfsSelecionadas((prev) =>
      checked ? [...prev, uf] : prev.filter((u) => u !== uf)
    );
  };

  const adicionarItem = (item: ItemDisponivel) => {
    const existe = itensSelecionados.find((i) => i.id === item.id);
    if (!existe) {
      setItensSelecionados((prev) => [...prev, { ...item, quantidade: 1 }]);
    }
  };

  const removerItem = (id: string) => {
    setItensSelecionados((prev) => prev.filter((item) => item.id !== id));
  };

  const atualizarQuantidade = (id: string, quantidade: number) => {
    if (quantidade < 1) return;
    setItensSelecionados((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade } : item
      )
    );
  };

  const handleSalvarRascunho = () => {
    if (itensSelecionados.length === 0) {
      toast.error("Adicione ao menos um item para salvar.");
      return;
    }
    toast.success("Rascunho salvo com sucesso!");
    navigate("/");
  };

  const handleContinuar = () => {
    if (itensSelecionados.length === 0) {
      toast.error("Adicione ao menos um item para continuar.");
      return;
    }
    if (fontesSelecionadas.length === 0) {
      toast.error("Selecione ao menos uma fonte de pesquisa.");
      return;
    }
    // Navegar para o resultado/relatório
    navigate("/resultado-busca");
  };

  return (
    <MainLayout title="Busca Manual de Itens" subtitle={nomeOrcamento}>
      <div className="space-y-4">
        {/* Header com nome do orçamento */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/novo-orcamento">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Filtros Compactos no Topo */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start gap-6">
            {/* Fontes - Toggle Buttons */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Fontes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {fontes.map((fonte) => (
                  <button
                    key={fonte.id}
                    onClick={() => handleFonteChange(fonte.id, !fontesSelecionadas.includes(fonte.id))}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                      fontesSelecionadas.includes(fonte.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {fonte.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* UFs - Compact Select */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Estados ({ufsSelecionadas.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {ufs.map((uf) => (
                  <button
                    key={uf}
                    onClick={() => handleUfChange(uf, !ufsSelecionadas.includes(uf))}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded transition-colors",
                      ufsSelecionadas.includes(uf)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {uf}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Área Principal: Busca + Resultados + Selecionados */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Coluna 1: Busca e Resultados */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-4">Buscar Itens</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Digite o item que deseja cotar..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Os resultados respeitam as fontes e regiões selecionadas
              </p>
            </div>

            {/* Resultados da busca */}
            {searchTerm.trim() && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/50">
                  <p className="text-sm font-medium">
                    {itensDisponiveis.length} itens encontrados
                  </p>
                </div>
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {itensDisponiveis.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhum item encontrado com os filtros selecionados
                    </div>
                  ) : (
                    itensDisponiveis.map((item) => {
                      const jaSelecionado = itensSelecionados.some((i) => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground">
                              {item.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.unidade} • {item.fonte} • R$ {item.preco.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={jaSelecionado ? "secondary" : "default"}
                            onClick={() => adicionarItem(item)}
                            disabled={jaSelecionado}
                            className="ml-2"
                          >
                            {jaSelecionado ? "Adicionado" : <Plus className="h-4 w-4" />}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2: Itens Selecionados */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-4">
                Itens Selecionados ({itensSelecionados.length})
              </h3>

              {itensSelecionados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum item selecionado ainda
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {itensSelecionados.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.unidade} • R$ {item.preco.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() =>
                            atualizarQuantidade(item.id, item.quantidade - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) =>
                            atualizarQuantidade(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-7 text-center text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() =>
                            atualizarQuantidade(item.id, item.quantidade + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removerItem(item.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de ações fixa */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {itensSelecionados.length} itens selecionados
              {fontesSelecionadas.length > 0 && (
                <span> • {fontesSelecionadas.length} fontes</span>
              )}
              {ufsSelecionadas.length > 0 && (
                <span> • {ufsSelecionadas.length} UF(s)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleSalvarRascunho}>
                <Save className="h-4 w-4" />
                Salvar Rascunho
              </Button>
              <Button className="gap-2" onClick={handleContinuar}>
                Gerar Relatório
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Espaço para a barra fixa */}
        <div className="h-20" />
      </div>
    </MainLayout>
  );
}
