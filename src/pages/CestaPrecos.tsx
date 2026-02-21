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

                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ShoppingBasket className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Itens na Cesta</p>
                                <p className="text-xl font-bold text-foreground">{itensAgrupados.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Fontes Consultadas</p>
                                <p className="text-xl font-bold text-foreground">{fontesPresentes.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Calculator className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total (Média)</p>
                                <p className="text-xl font-bold text-foreground">
                                    R$ {totalGeralMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total (Menor Preço)</p>
                                <p className="text-xl font-bold text-emerald-600">
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

                {/* Tabela comparativa de itens */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <ShoppingBasket className="h-5 w-5 text-primary" />
                            Itens da Cesta
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Comparação de preços por fonte com cálculos automáticos
                        </p>
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
                                            <tr key={`${item.id}-${index}`} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-sm text-foreground leading-tight">{item.nome}</p>
                                                    {item.orgao && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[250px]">
                                                            {item.orgao}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm text-muted-foreground">
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
                                                <td className="px-3 py-3 text-right text-sm font-medium">
                                                    R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-3 text-right text-sm font-bold text-emerald-600">
                                                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removerItem(index)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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

                {/* Resumo de cálculos por item agrupado */}
                {itensAgrupados.length > 0 && (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/50">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-primary" />
                                Resumo Consolidado
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Média, mediana e menor preço calculados automaticamente
                            </p>
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
                                <tbody className="divide-y divide-border">
                                    {itensAgrupados.map((grupo, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-sm text-foreground">{grupo.nomeBase}</p>
                                                <p className="text-[10px] text-muted-foreground">{grupo.unidade}</p>
                                            </td>
                                            <td className="px-3 py-3 text-center text-sm">{grupo.quantidade}</td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {grupo.precosPorFonte.map((pf, i) => (
                                                        <span key={i} className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${corFonte(pf.fonte)}`}>
                                                            {pf.fonte}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-medium">
                                                R$ {grupo.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-medium">
                                                R$ {grupo.mediana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-medium text-emerald-600">
                                                R$ {grupo.menorPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm font-bold">
                                                R$ {grupo.totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-emerald-50 dark:bg-emerald-900/20 border-t-2 border-emerald-200 dark:border-emerald-800">
                                        <td colSpan={3} className="px-4 py-3 font-bold text-emerald-900 dark:text-emerald-100">
                                            TOTAL GERAL
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-emerald-900 dark:text-emerald-100">
                                            R$ {totalGeralMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-emerald-900 dark:text-emerald-100">—</td>
                                        <td className="px-3 py-3 text-right font-bold text-emerald-600">
                                            R$ {totalGeralMenor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-emerald-900 dark:text-emerald-100">
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
