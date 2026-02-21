import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    FileCheck,
    Info,
    LayoutList,
    MousePointerClick,
    Search,
    Sparkles,
    Zap,
    CheckCircle2,
    Circle
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PNCPItem } from "@/lib/pncp";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface SpreadsheetItem {
    nome: string;
    descricao: string;
    quantidade: number;
    unidade: string;
}

interface ItemWithResults {
    original: SpreadsheetItem;
    results: PNCPItem[];
}

export default function SelecaoItensImportados() {
    const navigate = useNavigate();
    const location = useLocation();

    const nomeOrcamento = location.state?.nomeOrcamento || "Orçamento Importado";
    const itemsWithResults = (location.state?.itemsWithResults as ItemWithResults[]) || [];

    // State to track selected results for EACH item
    // Key: `${itemIndex}-${resultId}`
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set(itemsWithResults.map((_, i) => i)));

    const toggleItemExpansion = (index: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedItems(newExpanded);
    };

    const toggleSelection = (itemIndex: number, resultId: string) => {
        const key = `${itemIndex}-${resultId}`;
        const newSelected = new Set(selectedIds);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedIds(newSelected);
    };

    const selectAllForItem = (itemIndex: number) => {
        const item = itemsWithResults[itemIndex];
        const newSelected = new Set(selectedIds);
        let anyAdded = false;

        item.results.forEach(res => {
            const key = `${itemIndex}-${res.id}`;
            if (!newSelected.has(key)) {
                newSelected.add(key);
                anyAdded = true;
            }
        });

        if (!anyAdded) {
            // If all were already selected, deselect all for this item
            item.results.forEach(res => {
                newSelected.delete(`${itemIndex}-${res.id}`);
            });
        }

        setSelectedIds(newSelected);
    };

    const selectAllGlobal = () => {
        const newSelected = new Set<string>();
        itemsWithResults.forEach((item, itemIndex) => {
            item.results.forEach(res => {
                newSelected.add(`${itemIndex}-${res.id}`);
            });
        });
        setSelectedIds(newSelected);
        toast.success("Todos os itens encontrados foram selecionados!");
    };

    const deselectAllGlobal = () => {
        setSelectedIds(new Set());
        toast.info("Seleção limpa.");
    };

    const handleConfirm = () => {
        if (selectedIds.size === 0) {
            toast.error("Selecione ao menos uma opção encontrada para continuar.");
            return;
        }

        // Flatten selected results and attach quantity from original item
        const finalItens: any[] = [];
        itemsWithResults.forEach((group, itemIndex) => {
            group.results.forEach(result => {
                if (selectedIds.has(`${itemIndex}-${result.id}`)) {
                    finalItens.push({
                        ...result,
                        quantidade: group.original.quantidade || 1
                    });
                }
            });
        });

        navigate("/resultado-busca", {
            state: {
                itensSelecionados: finalItens,
                nomeOrcamento,
            }
        });
    };

    const totalResultsFound = useMemo(() => {
        return itemsWithResults.reduce((acc, curr) => acc + curr.results.length, 0);
    }, [itemsWithResults]);

    if (itemsWithResults.length === 0) {
        return (
            <MainLayout title="Seleção de Itens" subtitle={nomeOrcamento}>
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Nenhum dado para mostrar</h2>
                    <p className="text-muted-foreground mt-2">Volte e importe uma planilha para começar.</p>
                    <Button className="mt-6" onClick={() => navigate("/novo-orcamento")}>Voltar</Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Revisão de Sugestões" subtitle={nomeOrcamento}>
            <div className="mx-auto max-w-6xl space-y-6 pb-24">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md p-2 -m-2 rounded-lg">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={selectAllGlobal} className="gap-2 h-9">
                            <MousePointerClick className="h-4 w-4" />
                            Selecionar Todas as Sugestões
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAllGlobal} className="text-muted-foreground h-9">
                            Limpar Tudo
                        </Button>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Zap className="h-5 w-5 fill-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground">Inteligência de Busca Concluída</h4>
                        <p className="text-sm text-muted-foreground">
                            Encontramos <span className="font-bold text-primary">{totalResultsFound}</span> opções de preços para os <span className="font-bold text-foreground">{itemsWithResults.length}</span> itens da sua planilha. Selecione os que deseja incluir na média final.
                        </p>
                    </div>
                </div>

                {/* List of Items */}
                <div className="space-y-8">
                    {itemsWithResults.map((group, index) => {
                        const isExpanded = expandedItems.has(index);
                        const selectedInThisGroup = group.results.filter(r => selectedIds.has(`${index}-${r.id}`)).length;
                        const allSelectedInGroup = selectedInThisGroup === group.results.length && group.results.length > 0;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "group bg-card border rounded-2xl overflow-hidden transition-all duration-300",
                                    isExpanded ? "shadow-md ring-1 ring-primary/10" : "hover:border-primary/30"
                                )}
                            >
                                {/* Spreadsheet Item Header */}
                                <div
                                    className={cn(
                                        "p-4 md:p-6 flex items-center gap-4 cursor-pointer transition-colors",
                                        isExpanded ? "bg-muted/30" : "hover:bg-muted/10"
                                    )}
                                    onClick={() => toggleItemExpansion(index)}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shrink-0 shadow-inner">
                                        <LayoutList className="h-6 w-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded">ITEM {index + 1}</span>
                                            {selectedInThisGroup > 0 && (
                                                <Badge variant="outline" className="h-5 px-2 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    {selectedInThisGroup} Sugestões Selecionadas
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground truncate uppercase">{group.original.nome}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1 font-medium bg-secondary/50 px-2 py-0.5 rounded-full text-xs">
                                                {group.original.quantidade} {group.original.unidade}
                                            </span>
                                            {group.original.descricao && (
                                                <span className="truncate max-w-sm italic opacity-70">
                                                    "{group.original.descricao}"
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="hidden md:block text-right pr-4 border-r">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Opções Encontradas</p>
                                            <p className="text-xl font-black text-foreground">{group.results.length}</p>
                                        </div>
                                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                </div>

                                {/* Found Results for this item */}
                                {isExpanded && (
                                    <div className="border-t animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-4 bg-muted/10 flex items-center justify-between border-b">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Precificações disponíveis nas fontes oficiais:</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] h-7 font-bold uppercase tracking-tight gap-1.5 hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectAllForItem(index);
                                                }}
                                            >
                                                {allSelectedInGroup ? (
                                                    <> <Circle className="h-3 w-3" /> Desmarcar Tudo</>
                                                ) : (
                                                    <> <CheckCircle2 className="h-3 w-3" /> Selecionar Todas</>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar border-b">
                                            <div className="divide-y">
                                                {group.results.length === 0 ? (
                                                    <div className="p-8 text-center text-muted-foreground italic space-y-2">
                                                        <Search className="h-8 w-8 mx-auto opacity-20" />
                                                        <p>Infelizmente não encontramos correspondências para este item exato.</p>
                                                        <Button variant="outline" size="sm" className="mt-2 text-[10px] uppercase font-bold" onClick={() => navigate("/buscar-itens-manual", { state: { nomeOrcamento } })}>Buscar Manualmente</Button>
                                                    </div>
                                                ) : (
                                                    group.results.map((result) => {
                                                        const isSelected = selectedIds.has(`${index}-${result.id}`);

                                                        let badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100";
                                                        let badgeDot = "bg-blue-500";
                                                        if (result.fonte.includes("BPS") || result.fonte.includes("CMED")) {
                                                            badgeColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100";
                                                            badgeDot = "bg-red-500";
                                                        } else if (result.fonte.includes("SINAPI")) {
                                                            badgeColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-100";
                                                            badgeDot = "bg-green-500";
                                                        } else if (result.fonte.includes("PNCP (Local)")) {
                                                            badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100";
                                                            badgeDot = "bg-blue-500";
                                                        }

                                                        return (
                                                            <div
                                                                key={result.id}
                                                                className={cn(
                                                                    "flex items-start gap-4 p-4 transition-all",
                                                                    isSelected ? "bg-primary/5" : "hover:bg-muted/20"
                                                                )}
                                                            >
                                                                <Checkbox
                                                                    id={`res-${index}-${result.id}`}
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleSelection(index, result.id)}
                                                                    className="mt-1"
                                                                />
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider", badgeColor)}>
                                                                            <span className={cn("h-1 w-1 rounded-full", badgeDot)} />
                                                                            {result.fonte}
                                                                        </span>
                                                                        {result.metadata && (
                                                                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                                                {result.metadata}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm font-bold text-foreground leading-tight">{result.nome}</p>
                                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-medium uppercase">
                                                                        <span title={result.orgao} className="truncate max-w-[200px]">{result.orgao}</span>
                                                                        {result.cidadeUf && <span>{result.cidadeUf}</span>}
                                                                        {result.data && <span>{result.data}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Preço Ref.</p>
                                                                    <p className="text-base font-black text-emerald-600">R$ {result.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium">/{result.unidade}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t z-30 py-4 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="hidden sm:block">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resumo da Seleção</p>
                        <p className="text-sm font-black text-foreground">
                            {selectedIds.size} itens selecionados de {totalResultsFound} encontrados
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:text-right hidden md:block">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Precisão de Busca</p>
                            <div className="flex items-center gap-1 justify-end">
                                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                                <span className="text-xs font-bold text-success">Busca Integrada Ativa</span>
                            </div>
                        </div>

                        <Button
                            className="w-full sm:w-auto px-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            onClick={handleConfirm}
                        >
                            Confirmar e Consolidar Média
                            <FileCheck className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
