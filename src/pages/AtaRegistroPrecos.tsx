import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Download, Printer, Building2, User, Calendar, FileCheck,
    ArrowLeft, Hash, Clock, Scale
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ItemAta {
    nome: string;
    unidade: string;
    quantidade: number;
    preco: number;
    fonte: string;
}

export default function AtaRegistroPrecos() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportRef = useRef<HTMLDivElement>(null);
    const { profile, entidade } = useAuth();

    const state = location.state as {
        itens?: ItemAta[];
        itensAgrupados?: any[];
        nomeOrcamento?: string;
        orcamentoId?: string;
        entidade?: string;
        cnpjEntidade?: string;
        responsavel?: string;
        totalGeral?: number;
    } | undefined;

    const [isExporting, setIsExporting] = useState(false);

    // Dados da ata
    const nomeEntidade = entidade?.nome || state?.entidade || "Entidade Pública Municipal";
    const cnpjEntidade = state?.cnpjEntidade || "XX.XXX.XXX/XXXX-XX";
    const nomeResponsavel = profile?.nome || state?.responsavel || "Responsável não identificado";
    const dataHoje = new Date();
    const dataFormatada = dataHoje.toLocaleDateString('pt-BR');
    const vigenciaFim = new Date(dataHoje);
    vigenciaFim.setFullYear(vigenciaFim.getFullYear() + 1);
    const vigenciaFormatada = vigenciaFim.toLocaleDateString('pt-BR');

    // Número da ata: ANO/SEQUENCIAL
    const numeroAta = `${dataHoje.getFullYear()}/${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    // Processar itens — agrupar por nome e calcular média
    const itensRaw = state?.itens || [];

    // Agrupar itens por nome para pegar a média de preços
    const itensAgrupados = (() => {
        const grupos = new Map<string, { nome: string; unidade: string; quantidade: number; precos: number[]; fontes: string[] }>();

        itensRaw.forEach(item => {
            const key = item.nome.trim().toLowerCase();
            if (!grupos.has(key)) {
                grupos.set(key, {
                    nome: item.nome,
                    unidade: item.unidade || "UN",
                    quantidade: item.quantidade || 1,
                    precos: [],
                    fontes: []
                });
            }
            const g = grupos.get(key)!;
            if (item.preco > 0) {
                g.precos.push(item.preco);
                if (!g.fontes.includes(item.fonte)) g.fontes.push(item.fonte);
            }
        });

        return Array.from(grupos.values()).map((g, idx) => {
            const media = g.precos.length > 0 ? g.precos.reduce((a, b) => a + b, 0) / g.precos.length : 0;
            return {
                numero: idx + 1,
                nome: g.nome,
                unidade: g.unidade,
                quantidade: g.quantidade,
                valorUnitario: media,
                valorTotal: media * g.quantidade,
                fontes: g.fontes.join(", ")
            };
        });
    })();

    const totalGeral = itensAgrupados.reduce((acc, i) => acc + i.valorTotal, 0);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        try {
            toast.info("Gerando PDF da Ata de Registro de Preços...");

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Ata_Registro_Precos_${numeroAta.replace('/', '_')}.pdf`);
            toast.success("PDF da Ata exportado com sucesso!");
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <MainLayout title="Ata de Registro de Preços" subtitle={state?.nomeOrcamento || "Documento formal"}>
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between print:hidden bg-card p-4 rounded-lg border border-border sticky top-4 z-10 shadow-sm">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        Voltar à Cesta
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleExportPDF} disabled={isExporting}>
                            <Download className="h-4 w-4" />
                            {isExporting ? "Gerando..." : "Exportar PDF"}
                        </Button>
                    </div>
                </div>

                {/* Documento da Ata */}
                <div ref={reportRef} className="rounded-lg border border-border bg-white text-black p-10 print:border-none print:p-0 shadow-lg" style={{ fontFamily: "'Times New Roman', serif" }}>

                    {/* Cabeçalho */}
                    <div className="text-center mb-8">
                        <h1 className="text-xl font-bold uppercase tracking-wide mb-1">
                            Ata de Registro de Preços
                        </h1>
                        <p className="text-sm text-gray-600 mb-4">
                            Nº {numeroAta}
                        </p>
                        <div className="w-24 h-0.5 bg-gray-400 mx-auto" />
                    </div>

                    {/* Identificação */}
                    <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Building2 className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Órgão Gerenciador</p>
                                    <p className="font-semibold">{nomeEntidade}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Hash className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">CNPJ</p>
                                    <p className="font-medium">{cnpjEntidade}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Responsável</p>
                                    <p className="font-medium">{nomeResponsavel}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Data / Vigência</p>
                                    <p className="font-medium">{dataFormatada} a {vigenciaFormatada}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6 bg-gray-300" />

                    {/* Preâmbulo */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Preâmbulo
                        </h2>
                        <div className="text-sm leading-relaxed text-gray-800 text-justify space-y-3">
                            <p>
                                Aos {dataHoje.getDate()} dias do mês de {dataHoje.toLocaleDateString('pt-BR', { month: 'long' })} do ano de {dataHoje.getFullYear()}, <strong>{nomeEntidade}</strong>, inscrita no CNPJ sob o nº <strong>{cnpjEntidade}</strong>, por intermédio de seu representante legal, resolve registrar os preços para eventual aquisição dos itens abaixo discriminados, com base nos termos da Lei Federal nº 14.133/2021 e demais legislações aplicáveis, conforme condições estabelecidas nesta Ata.
                            </p>
                            <p>
                                A pesquisa de preços que fundamenta esta Ata foi realizada por meio do <strong>Sistema Média Fácil</strong>, utilizando consultas às bases oficiais do governo (PNCP, BPS, CMED, SINAPI, entre outras), em conformidade com os critérios de atualidade, representatividade e razoabilidade dos preços praticados.
                            </p>
                        </div>
                    </div>

                    <Separator className="my-6 bg-gray-300" />

                    {/* Objeto */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
                            <FileCheck className="h-4 w-4" />
                            Cláusula Primeira — Do Objeto
                        </h2>
                        <p className="text-sm text-gray-800 leading-relaxed text-justify">
                            A presente Ata tem por objeto o <strong>registro de preços</strong> para eventual aquisição dos itens discriminados abaixo, nas quantidades estimadas, pelo período de vigência de <strong>12 (doze) meses</strong>, a contar da data de assinatura desta Ata, podendo ser prorrogada na forma da legislação vigente.
                        </p>
                    </div>

                    <Separator className="my-6 bg-gray-300" />

                    {/* Tabela de Itens */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Cláusula Segunda — Dos Itens e Preços Registrados
                        </h2>

                        <table className="w-full border-collapse text-sm mb-4">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-3 py-2 text-center font-bold w-10">Nº</th>
                                    <th className="border border-gray-300 px-3 py-2 text-left font-bold">Descrição do Item</th>
                                    <th className="border border-gray-300 px-3 py-2 text-center font-bold w-14">Und</th>
                                    <th className="border border-gray-300 px-3 py-2 text-center font-bold w-14">Qtd Est.</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right font-bold w-28">Valor Unit. (R$)</th>
                                    <th className="border border-gray-300 px-3 py-2 text-right font-bold w-28">Valor Total (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itensAgrupados.map((item) => (
                                    <tr key={item.numero} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2 text-center">{item.numero}</td>
                                        <td className="border border-gray-300 px-3 py-2">
                                            <p className="font-medium">{item.nome}</p>
                                            {item.fontes && (
                                                <p className="text-[10px] text-gray-500 mt-0.5">Ref.: {item.fontes}</p>
                                            )}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-center">{item.unidade}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-center">{item.quantidade}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right">
                                            {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                                            {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan={5} className="border border-gray-300 px-3 py-2 text-right uppercase">
                                        Valor Total Estimado
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right text-lg">
                                        R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <Separator className="my-6 bg-gray-300" />

                    {/* Cláusulas */}
                    <div className="mb-8 space-y-6 text-sm text-gray-800 leading-relaxed text-justify">
                        <div>
                            <h2 className="font-bold uppercase mb-2">Cláusula Terceira — Da Vigência</h2>
                            <p>
                                A presente Ata de Registro de Preços terá vigência de <strong>12 (doze) meses</strong>, contados a partir de sua assinatura, podendo ser prorrogada por igual período, desde que comprovada a vantajosidade dos preços registrados, nos termos do Art. 84 da Lei nº 14.133/2021.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-bold uppercase mb-2">Cláusula Quarta — Das Condições de Fornecimento</h2>
                            <p>
                                Os itens registrados serão adquiridos conforme a necessidade do Órgão Gerenciador, mediante emissão de <strong>Ordem de Fornecimento</strong>, observadas as quantidades estimadas nesta Ata. O fornecedor registrado ficará obrigado a atender todos os pedidos efetuados durante a vigência da Ata, mesmo que a entrega esteja prevista para data posterior ao seu vencimento.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-bold uppercase mb-2">Cláusula Quinta — Do Reajuste de Preços</h2>
                            <p>
                                Os preços registrados poderão ser revistos em decorrência de eventual redução dos preços praticados no mercado ou fato que eleve o custo dos bens registrados, cabendo ao Órgão Gerenciador promover as negociações junto aos fornecedores.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-bold uppercase mb-2">Cláusula Sexta — Da Legislação Aplicável</h2>
                            <p>
                                A presente Ata rege-se pelas disposições expressas na <strong>Lei Federal nº 14.133/2021</strong>, e demais normas aplicáveis, e, subsidiariamente, pelos princípios gerais de direito público, aplicando-se supletivamente os princípios da teoria geral dos contratos e as disposições de direito privado.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-bold uppercase mb-2">Cláusula Sétima — Do Foro</h2>
                            <p>
                                Fica eleito o foro da Comarca da sede do Órgão Gerenciador para dirimir quaisquer questões decorrentes da utilização desta Ata de Registro de Preços.
                            </p>
                        </div>
                    </div>

                    <Separator className="my-8 bg-gray-300" />

                    {/* Assinaturas */}
                    <div className="mt-12 mb-8">
                        <p className="text-sm text-gray-800 text-center mb-12">
                            E por estarem de acordo, as partes assinam a presente Ata de Registro de Preços.
                        </p>

                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-600">
                                {nomeEntidade}, {dataHoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-16 mt-16">
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 mx-8">
                                    <p className="font-bold text-sm">{nomeResponsavel}</p>
                                    <p className="text-xs text-gray-600">Órgão Gerenciador</p>
                                    <p className="text-xs text-gray-500">{nomeEntidade}</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 pt-2 mx-8">
                                    <p className="font-bold text-sm">Fornecedor Registrado</p>
                                    <p className="text-xs text-gray-600">Representante Legal</p>
                                    <p className="text-xs text-gray-500">CNPJ: ___.___.___/____-__</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé */}
                    <div className="text-center text-[10px] text-gray-400 mt-16 pt-4 border-t border-gray-200">
                        <p>Documento gerado digitalmente pelo Sistema Média Fácil — Integridade verificável</p>
                        <p className="mt-1">Ata nº {numeroAta} • {dataFormatada} • {nomeEntidade}</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
