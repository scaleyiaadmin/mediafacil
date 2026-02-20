import { useState, useEffect } from "react";
import { Search, Plus, Check, ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { searchReferences } from "@/lib/referencias";
import { PNCPItem as Item } from "@/lib/pncp";

interface ItemSelecionado extends Item {
  quantidade: number;
}

export default function BuscarItens() {
  const navigate = useNavigate();
  const location = useLocation();
  const nomeOrcamento = location.state?.nomeOrcamento || "Novo Orçamento";

  const [busca, setBusca] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<ItemSelecionado[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [itensFiltrados, setItensFiltrados] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (busca.length >= 3) {
        setLoading(true);
        try {
          const results = await searchReferences(busca, { catser: true, sinapi: true, cmed: true });
          setItensFiltrados(results);
        } catch (error) {
          console.error("Erro ao buscar referências:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setItensFiltrados([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [busca]);

  const handleSelecionar = (item: Item) => {
    const quantidade = quantidades[item.id] || 1;
    const jaExiste = itensSelecionados.find(i => i.id === item.id);

    if (jaExiste) {
      setItensSelecionados(itensSelecionados.filter(i => i.id !== item.id));
    } else {
      setItensSelecionados([...itensSelecionados, { ...item, quantidade }]);
    }
  };

  const isItemSelecionado = (id: string) => itensSelecionados.some(i => i.id === id);

  return (
    <MainLayout title="Buscar Itens" subtitle="Encontre e adicione itens ao seu orçamento">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Barra de busca */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Digite o item que deseja cotar</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ex: caneta, papel, cimento, dipirona..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Resultados da busca */}
        {busca.length >= 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {itensFiltrados.length} itens encontrados para "{busca}"
            </p>

            {itensFiltrados.length > 0 ? (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border">
                  {itensFiltrados.map((item) => {
                    const selecionado = isItemSelecionado(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{item.nome}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">
                              Unidade: {item.unidade}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                              {item.fonte}
                            </span>
                            <span className="text-sm font-medium text-primary">
                              R$ {item.preco.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Qtd:</span>
                            <Input
                              type="number"
                              min="1"
                              value={quantidades[item.id] || 1}
                              onChange={(e) => setQuantidades({
                                ...quantidades,
                                [item.id]: parseInt(e.target.value) || 1
                              })}
                              className="w-20 h-8 text-center"
                            />
                          </div>

                          <Button
                            size="sm"
                            variant={selecionado ? "default" : "outline"}
                            onClick={() => handleSelecionar(item)}
                            className="gap-1"
                          >
                            {selecionado ? (
                              <>
                                <Check className="h-4 w-4" />
                                Selecionado
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Selecionar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item encontrado para sua busca.
              </div>
            )}
          </div>
        )}

        {/* Itens selecionados */}
        {itensSelecionados.length > 0 && (
          <div className="fixed bottom-0 left-64 right-0 border-t border-border bg-card p-4 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {itensSelecionados.length} itens selecionados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total estimado: R$ {itensSelecionados.reduce((acc, item) => acc + (item.preco * item.quantidade), 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                className="gap-2"
                onClick={() => navigate("/resultado-busca", {
                  state: {
                    itensSelecionados,
                    nomeOrcamento
                  }
                })}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
