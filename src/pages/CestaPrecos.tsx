import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ShoppingBasket, ArrowLeft, ArrowRight, Minus, Plus, Trash2,
    FileText, FileCheck, TrendingDown, Calculator, BarChart3, Loader2
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PNCPItem } from "@/lib/pncp";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ItemCesta extends PNCPItem {
    quantidade: number;
}

interface FontePreco {
    fonte: string;
    valor: number;
}

interface ItemAgrupado {
    nomeBase: string;
    unidade: string;
    quantidade: number;
    precosPorFonte: FontePreco[];
    media: number;
    mediana: number;
    menorPreco: number;
    totalEstimado: number;
}

function calcularMedia(valores: number[]): number {
    if (valores.length === 0) return 0;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function calcularMediana(valores: number[]): number {
    if (valores.length === 0) return 0;
    const sorted = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[meio]
        : (sorted[meio - 1] + sorted[meio]) / 2;
}

export default function CestaPrecos() {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, entidade } = useAuth();

    const itensSelecionados = (location.state?.itensSelecionados as ItemCesta[]) || [];
    const nomeOrcamento = location.state?.nomeOrcamento || "Orçamento";
    const orcamentoId = location.state?.orcamentoId as string | undefined;

    const [itens, setItens] = useState<ItemCesta[]>(itensSelecionados);
    const [isNavigating, setIsNavigating] = useState(false);

    // Agrupar itens por nome para criar a visão comparativa
    const itensAgrupados = useMemo<ItemAgrupado[]>(() => {
        const grupos = new Map<string, ItemCesta[]>();

        itens.forEach(item => {
            // Normalizar nome para agrupar (case insensitive, trim)
            const nomeNorm = item.nome.trim().toLowerCase();
            if (!grupos.has(nomeNorm)) {
                grupos.set(nomeNorm, []);
            }
            grupos.get(nomeNorm)!.push(item);
        });

        return Array.from(grupos.entries()).map(([_, itensGrupo]) => {
            const precosPorFonte: FontePreco[] = itensGrupo.map(i => ({
                fonte: i.fonte,
                valor: i.preco
            }));

            const valores = precosPorFonte.map(p => p.valor).filter(v => v > 0);
            const media = calcularMedia(valores);
            const mediana = calcularMediana(valores);
            const menorPreco = valores.length > 0 ? Math.min(...valores) : 0;
            const quantidade = itensGrupo[0].quantidade || 1;

            return {
                nomeBase: itensGrupo[0].nome,
                unidade: itensGrupo[0].unidade || "UN",
                quantidade,
                precosPorFonte,
                media,
                mediana,
                menorPreco,
                totalEstimado: media * quantidade
            };
        });
    }, [itens]);

    // Fontes únicas presentes
    const fontesPresentes = useMemo(() => {
        const set = new Set<string>();
        itens.forEach(i => set.add(i.fonte));
        return Array.from(set);
    }, [itens]);

    // Totais gerais
    const totalGeralMedia = useMemo(() =>
        itensAgrupados.reduce((acc, i) => acc + i.totalEstimado, 0),
        [itensAgrupados]
    );

    const totalGeralMenor = useMemo(() =>
        itensAgrupados.reduce((acc, i) => acc + (i.menorPreco * i.quantidade), 0),
        [itensAgrupados]
    );

    const removerItem = (index: number) => {
        const item = itens[index];
        setItens(prev => prev.filter((_, i) => i !== index));
        toast.info(`"${item.nome}" removido da cesta.`);
    };

    const atualizarQuantidade = (index: number, novaQtd: number) => {
        if (novaQtd < 1) return;
        setItens(prev => prev.map((item, i) =>
            i === index ? { ...item, quantidade: novaQtd } : item
        ));
    };

    const handleGerarRelatorio = () => {
        if (itens.length === 0) {
            toast.error("Adicione ao menos um item à cesta.");
            return;
        }
        setIsNavigating(true);
        navigate("/relatorio-final", {
            state: {
                orcamentoId,
                itens,
                nomeOrcamento,
                entidade: entidade?.nome || "Prefeitura não identificada",
                responsavel: profile?.nome || "Usuário não identificado",
            }
        });
    };

    const handleGerarAta = () => {
        if (itens.length === 0) {
            toast.error("Adicione ao menos um item à cesta.");
            return;
        }
        setIsNavigating(true);
        navigate("/ata-registro-precos", {
            state: {
                orcamentoId,
                itens,
                itensAgrupados,
                nomeOrcamento,
                entidade: entidade?.nome || "Prefeitura não identificada",
                cnpjEntidade: "",
                responsavel: profile?.nome || "Usuário não identificado",
                totalGeral: totalGeralMedia
            }
        });
    };

    // Cores por fonte
    const corFonte = (fonte: string): string => {
        if (fonte.includes("PNCP")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
        if (fonte.includes("CMED") || fonte.includes("BPS")) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
        if (fonte.includes("SINAPI") || fonte.includes("SETOP")) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
        if (fonte.includes("CATSER") || fonte.includes("CEASA")) return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200";
        if (fonte.includes("NFe")) return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200";
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    };

    return (
        <MainLayout title="Cesta de Preços" subtitle={nomeOrcamento}>
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {itens.length} itens • {fontesPresentes.length} fontes
                        </span>
                    </div>
                </div>

                {/* Cards de resumo compactos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <ShoppingBasket className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-70">Itens</p>
                                <p className="text-lg font-bold text-foreground">{itensAgrupados.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-70">Fontes</p>
                                <p className="text-lg font-bold text-foreground">{fontesPresentes.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                                <Calculator className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-70">Total (Média)</p>
                                <p className="text-lg font-bold text-foreground">
                                    R$ {totalGeralMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-70">Total (Menor)</p>
                                <p className="text-lg font-bold text-emerald-600">
                                    R$ {totalGeralMenor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fontes presentes */}
                <div className="flex flex-wrap gap-2">
                    {fontesPresentes.map(fonte => (
                        <span key={fonte} className={`px-3 py-1 text-xs font-bold rounded-full ${corFonte(fonte)}`}>
                            {fonte}
                        </span>
                    ))}
                </div>

                <Separator />

                {/* Tabela comparativa de itens condensada */}
                <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                            <ShoppingBasket className="h-4 w-4 text-primary" />
                            Itens da Cesta
                        </h3>
                    </div>

                    {itens.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <ShoppingBasket className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">Sua cesta está vazia</p>
                            <p className="text-sm mt-1">Volte e adicione itens para montar a cesta de preços.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 min-w-[200px]">
                                            Item
                                        </th>
                                        <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 w-16">
                                            Und
                                        </th>
                                        <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 w-24">
                                            Qtd
                                        </th>
                                        <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3">
                                            Fonte
                                        </th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">
                                            Preço Unit.
                                        </th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">
                                            Total
                                        </th>
                                        <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 w-16">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {itens.map((item, index) => {
                                        const total = (item.preco || 0) * (item.quantidade || 1);
                                        return (
                                            <tr key={`${item.id}-${index}`} className="hover:bg-muted/10 transition-colors border-b border-border last:border-0 text-xs">
                                                <td className="px-4 py-2">
                                                    <p className="font-bold text-foreground leading-tight uppercase text-[11px] tracking-tight">{item.nome}</p>
                                                    {item.orgao && (
                                                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[200px] opacity-70">
                                                            {item.orgao}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-center font-medium opacity-70">
                                                    {item.unidade}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-6 w-6"
                                                            onClick={() => atualizarQuantidade(index, item.quantidade - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantidade}
                                                            onChange={(e) => atualizarQuantidade(index, parseInt(e.target.value) || 1)}
                                                            className="w-14 h-6 text-center text-xs"
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-6 w-6"
                                                            onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${corFonte(item.fonte)}`}>
                                                        {item.fonte}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-emerald-600">
                                                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removerItem(index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Resumo de cálculos condensado */}
                {itensAgrupados.length > 0 && (
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-border bg-muted/30">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                                <Calculator className="h-4 w-4 text-primary" />
                                Resumo Consolidado
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Item</th>
                                        <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3">Qtd</th>
                                        <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3">Fontes</th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">Média</th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">Mediana</th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">Menor</th>
                                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">Total Est.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-[11px]">
                                    {itensAgrupados.map((grupo, idx) => (
                                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-4 py-2">
                                                <p className="font-bold text-foreground uppercase leading-tight tracking-tight">{grupo.nomeBase}</p>
                                                <p className="text-[9px] text-muted-foreground opacity-70">{grupo.unidade}</p>
                                            </td>
                                            <td className="px-3 py-2 text-center font-medium">{grupo.quantidade}</td>
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {grupo.precosPorFonte.map((pf, i) => (
                                                        <span key={i} className={`px-1 py-0.5 text-[8px] font-bold rounded ${corFonte(pf.fonte)}`}>
                                                            {pf.fonte}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                R$ {grupo.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                R$ {grupo.mediana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-emerald-600">
                                                R$ {grupo.menorPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2 text-right font-black">
                                                R$ {grupo.totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-emerald-50 dark:bg-emerald-900/10 border-t-2 border-emerald-100 dark:border-emerald-900 py-1">
                                        <td colSpan={3} className="px-4 py-2 font-black text-emerald-800 dark:text-emerald-100 text-[10px] uppercase">
                                            TOTAL GERAL
                                        </td>
                                        <td className="px-3 py-2 text-right font-black text-emerald-800 dark:text-emerald-100 text-[11px]">
                                            R$ {totalGeralMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-emerald-800/50 dark:text-emerald-100/50 text-[11px]">—</td>
                                        <td className="px-3 py-2 text-right font-black text-emerald-600 text-[11px]">
                                            R$ {totalGeralMenor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-right font-black text-emerald-800 dark:text-emerald-100 text-[11px]">
                                            R$ {totalGeralMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
                    <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 w-full sm:w-auto"
                        onClick={handleGerarRelatorio}
                        disabled={isNavigating || itens.length === 0}
                    >
                        {isNavigating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                        Gerar Relatório de Preços
                    </Button>

                    <Button
                        size="lg"
                        className="gap-2 w-full sm:w-auto"
                        onClick={handleGerarAta}
                        disabled={isNavigating || itens.length === 0}
                    >
                        {isNavigating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck className="h-5 w-5" />}
                        Gerar Ata de Registro de Preços
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}
