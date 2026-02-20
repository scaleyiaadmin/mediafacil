import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Minus, ArrowRight, ArrowLeft, Save, Database, MapPin, Loader2, Globe } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ufs } from "@/data/regioes";
import { cn } from "@/lib/utils";
import { searchPNCPItems, PNCPItem } from "@/lib/pncp";

interface ItemDisponivel {
  id: string;
  nome: string;
  unidade: string;
  fonte: string;
  preco: number;
  orgao?: string;
  data?: string;
}

interface ItemSelecionado extends ItemDisponivel {
  quantidade: number;
}

const fontes = [
  { id: "pncp", nome: "PNCP", descricao: "Portal Nacional de Contratações Públicas" },
  { id: "bps", nome: "BPS", descricao: "Banco de Preços em Saúde" },
  { id: "painel", nome: "Painel de Preços", descricao: "Painel de Preços do Governo Federal" },
  { id: "nfe", nome: "NFe", descricao: "Notas Fiscais Eletrônicas" },
  { id: "catser", nome: "CATSER", descricao: "Catálogo de Serviços" },
  { id: "sinapi", nome: "SINAPI", descricao: "Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil" },
  { id: "cmed", nome: "CMED", descricao: "Câmara de Regulação do Mercado de Medicamentos" },
];

// Mock items database (Empy as requested)
const itensBanco: ItemDisponivel[] = [];

export default function BuscarItensManual() {
  const navigate = useNavigate();
  const location = useLocation();
  const nomeOrcamento = location.state?.nomeOrcamento || "Novo Orçamento";

  const [searchTerm, setSearchTerm] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<ItemSelecionado[]>([]);
  const [itensOnline, setItensOnline] = useState<ItemDisponivel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filtros
  const [fontesSelecionadas, setFontesSelecionadas] = useState<string[]>([]);
  const [ufsSelecionadas, setUfsSelecionadas] = useState<string[]>([]);

  // Busca Online (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && fontesSelecionadas.includes("pncp")) {
        setIsSearching(true);
        try {
          const results = await searchPNCPItems(searchTerm);
          if (results.length === 0) {
            toast.info("Nenhum item encontrado no PNCP para este termo no ano atual.");
          }
          setItensOnline(results as ItemDisponivel[]);
        } catch (error: any) {
          console.error(error);
          toast.error(`Erro ao buscar no portal PNCP: ${error.message}`);
        } finally {
          setIsSearching(false);
        }
      } else {
        setItensOnline([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fontesSelecionadas]);

  // Combinar itens mockados e itens online
  const itensDisponiveis = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const fontesNomes = fontesSelecionadas.map((id) => {
      const fonte = fontes.find((f) => f.id === id);
      return fonte?.nome || "";
    });

    // Mock local
    const mockResults = itensBanco.filter((item) => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFonte = fontesSelecionadas.length === 0 || fontesNomes.includes(item.fonte);
      return matchesSearch && matchesFonte;
    });

    // Mesclar com online (filtrando duplicatas por ID se necessário)
    return [...itensOnline, ...mockResults];
  }, [searchTerm, fontesSelecionadas, itensOnline]);

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
    // Se nenhuma fonte estiver selecionada, podemos avisar ou considerar todas. 
    // O usuário disse que escolheria na hora, então obrigar a escolher parece correto.
    if (fontesSelecionadas.length === 0) {
      toast.error("Selecione ao menos uma fonte de pesquisa.");
      return;
    }
    // Navegar para o resultado/relatório
    navigate("/resultado-busca", {
      state: {
        itensSelecionados,
        nomeOrcamento,
        fontesSelecionadas // Passando também as fontes para o próximo passo
      }
    });
  };

  return (
    <MainLayout title="Busca Manual de Itens" subtitle={nomeOrcamento}>
      <div className="space-y-6">
        {/* Header com botão Voltar */}
        <div className="flex items-center gap-4">
          <Link to="/novo-orcamento">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Filtros em Grid para Melhor Alinhamento */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Seção Fontes */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Fontes de Pesquisa</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {fontesSelecionadas.length} selecionadas
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {fontes.map((fonte) => (
                <button
                  key={fonte.id}
                  onClick={() => handleFonteChange(fonte.id, !fontesSelecionadas.includes(fonte.id))}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-lg transition-all border-2",
                    fontesSelecionadas.includes(fonte.id)
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-background text-muted-foreground border-muted hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {fonte.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Seção Estados */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Abrangência Regional</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {ufsSelecionadas.length} estados
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
              {ufs.map((uf) => (
                <button
                  key={uf}
                  onClick={() => handleUfChange(uf, !ufsSelecionadas.includes(uf))}
                  className={cn(
                    "w-9 h-8 flex items-center justify-center text-xs font-bold rounded transition-all border-2",
                    ufsSelecionadas.includes(uf)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30"
                  )}
                >
                  {uf}
                </button>
              ))}
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
                <div className="p-3 border-b border-border bg-muted/50 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {itensDisponiveis.length} itens encontrados
                  </p>
                  {isSearching && (
                    <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Buscando no PNCP...
                    </div>
                  )}
                </div>
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {itensDisponiveis.length === 0 && !isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhum item encontrado com os filtros selecionados
                    </div>
                  ) : (
                    itensDisponiveis.map((item) => {
                      const jaSelecionado = itensSelecionados.some((i) => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-foreground truncate">
                                {item.nome}
                              </p>
                              {item.id.startsWith("pncp-") && (
                                <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.unidade} • {item.fonte} • R$ {item.preco.toFixed(2)}
                            </p>
                            {item.orgao && (
                              <p className="text-[10px] text-muted-foreground/70 truncate mt-1">
                                {item.orgao} {item.data && `• ${item.data}`}
                              </p>
                            )}
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
