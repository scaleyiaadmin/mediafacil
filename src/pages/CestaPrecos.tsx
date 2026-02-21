import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ShoppingBasket, ArrowLeft, Loader2,
    TrendingDown, BarChart3, Calculator
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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


                {/* Resumo de cálculos condensado */}
                {itensAgrupados.length > 0 && (
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-border bg-muted/30">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                                <ShoppingBasket className="h-4 w-4 text-primary" />
                                Itens da Cesta
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

            </div>
        </MainLayout>
    );
}
