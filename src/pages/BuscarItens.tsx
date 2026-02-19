import { useState } from "react";
import { Search, Plus, Check, ShoppingCart, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface Item {
  id: string;
  nome: string;
  unidade: string;
  fonte: string;
  preco: number;
}

interface ItemSelecionado extends Item {
  quantidade: number;
}

const itensDisponiveis: Item[] = [
  { id: "1", nome: "Caneta esferográfica azul", unidade: "UN", fonte: "PNCP", preco: 1.50 },
  { id: "2", nome: "Caneta esferográfica preta", unidade: "UN", fonte: "BPS", preco: 1.45 },
  { id: "3", nome: "Caneta esferográfica vermelha", unidade: "UN", fonte: "Painel de Preços", preco: 1.55 },
  { id: "4", nome: "Papel A4 500 folhas", unidade: "PCT", fonte: "PNCP", preco: 24.90 },
  { id: "5", nome: "Papel A4 resma 500 folhas", unidade: "RS", fonte: "NFe", preco: 23.50 },
  { id: "6", nome: "Grampeador de mesa", unidade: "UN", fonte: "BPS", preco: 18.90 },
  { id: "7", nome: "Clips para papel 2/0", unidade: "CX", fonte: "PNCP", preco: 3.20 },
  { id: "8", nome: "Borracha branca", unidade: "UN", fonte: "Painel de Preços", preco: 0.85 },
];

export default function BuscarItens() {
  const [busca, setBusca] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<ItemSelecionado[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  const itensFiltrados = busca.length >= 2 
    ? itensDisponiveis.filter(item => 
        item.nome.toLowerCase().includes(busca.toLowerCase())
      )
    : [];

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
              placeholder="Ex: caneta, papel, grampeador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
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

              <Link to="/configurar-busca">
                <Button className="gap-2">
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
