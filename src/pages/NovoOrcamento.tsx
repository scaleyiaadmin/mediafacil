import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, PenLine, FileSpreadsheet, Search, Loader2, CheckCircle, ArrowRight, Tag, FileSearch, Database, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ItemImportado {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  correspondencia?: string;
}

const itensMockImportados: ItemImportado[] = [
  { id: "1", nome: "Caneta esferográfica azul", descricao: "Caneta esferográfica ponta média 1.0mm", unidade: "UN", quantidade: 500, correspondencia: "3 resultados encontrados" },
  { id: "2", nome: "Papel A4 75g", descricao: "Papel sulfite A4 75g/m² branco 500 folhas", unidade: "RSM", quantidade: 100, correspondencia: "5 resultados encontrados" },
  { id: "3", nome: "Grampeador de mesa", descricao: "Grampeador de mesa para grampo 26/6", unidade: "UN", quantidade: 25, correspondencia: "2 resultados encontrados" },
  { id: "4", nome: "Clips nº 2/0", descricao: "Clips galvanizado nº 2/0 caixa c/ 100", unidade: "CX", quantidade: 50, correspondencia: "4 resultados encontrados" },
  { id: "5", nome: "Pasta suspensa", descricao: "Pasta suspensa kraft com visor", unidade: "UN", quantidade: 200, correspondencia: "2 resultados encontrados" },
  { id: "6", nome: "Envelope ofício", descricao: "Envelope ofício branco 114x229mm", unidade: "UN", quantidade: 1000, correspondencia: "6 resultados encontrados" },
];

const loadingSteps = [
  { label: "Lendo planilha...", icon: FileSpreadsheet },
  { label: "Analisando itens...", icon: FileSearch },
  { label: "Identificando correspondências...", icon: Database },
  { label: "Buscando preços de referência...", icon: Sparkles },
];

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [itensImportados, setItensImportados] = useState<ItemImportado[]>([]);
  const [fileName, setFileName] = useState("");
  const [nomeOrcamento, setNomeOrcamento] = useState("");
  const [nomeError, setNomeError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"import" | "manual" | null>(null);

  // Animate progress and steps
  useEffect(() => {
    if (isLoading) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 60);

      const stepInterval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingSteps.length - 1) {
            clearInterval(stepInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 750);

      return () => {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      };
    }
  }, [isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
        return;
      }
      setFileName(file.name);
      setIsLoading(true);
      setProgress(0);
      setLoadingStep(0);
      setItensImportados([]);

      // Simular processamento
      setTimeout(() => {
        setIsLoading(false);
        setDialogOpen(false);
        setItensImportados(itensMockImportados);
        setReviewDialogOpen(true);
        toast.success(`${itensMockImportados.length} itens encontrados!`);
      }, 3500);
    }
  };

  const handleContinuarImportacao = () => {
    setReviewDialogOpen(false);
    toast.success("Itens importados com sucesso!");
    navigate("/resultado-busca");
  };

  const handleStartBudget = (method: "import" | "manual") => {
    setSelectedMethod(method);
    setNomeOrcamento("");
    setNomeError(false);
    setNameDialogOpen(true);
  };

  const handleConfirmName = () => {
    if (!nomeOrcamento.trim()) {
      setNomeError(true);
      return;
    }
    
    setNameDialogOpen(false);
    
    if (selectedMethod === "import") {
      setDialogOpen(true);
    } else if (selectedMethod === "manual") {
      // Passar o nome do orçamento como state
      navigate("/buscar-itens-manual", { state: { nomeOrcamento } });
    }
  };

  return (
    <MainLayout title="Novo Orçamento" subtitle="Escolha como deseja criar seu orçamento">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Título da seção */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Como você deseja criar o orçamento?</h2>
          <p className="mt-2 text-muted-foreground">
            Escolha uma das opções abaixo para começar
          </p>
        </div>

        {/* Opções de criação */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Opção 1: Importar Excel */}
          <div className="group relative rounded-xl border-2 border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground mb-4">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Importar Itens via Excel
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                Faça upload de uma planilha com os itens que deseja cotar
              </p>

              <div className="w-full rounded-lg bg-muted/50 p-4 text-left mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  O arquivo deve conter:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Nome do item
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Descrição
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Unidade
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Quantidade
                  </li>
                </ul>
              </div>

              <Button className="w-full gap-2" onClick={() => handleStartBudget("import")}>
                <Upload className="h-4 w-4" />
                Importar Planilha
              </Button>
            </div>
          </div>

          {/* Opção 2: Criar manualmente */}
          <div className="group relative rounded-xl border-2 border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground mb-4">
                <PenLine className="h-8 w-8" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Criar Orçamento Manualmente
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                Busque e adicione itens um a um usando nossa busca inteligente
              </p>

              <div className="w-full rounded-lg bg-muted/50 p-4 text-left mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Você poderá:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Selecionar fontes e regiões
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Buscar itens por nome
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Ver preços de referência
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Salvar como rascunho
                  </li>
                </ul>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={() => handleStartBudget("manual")}>
                <Search className="h-4 w-4" />
                Buscar Itens
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog para Nome do Orçamento */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Nome do Orçamento
            </DialogTitle>
            <DialogDescription>
              Informe um nome que identifique claramente o contexto deste orçamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome-orcamento">
                Nome do Orçamento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome-orcamento"
                placeholder="Ex: Material de escritório – Secretaria de Educação"
                value={nomeOrcamento}
                onChange={(e) => {
                  setNomeOrcamento(e.target.value);
                  setNomeError(false);
                }}
                className={nomeError ? "border-destructive" : ""}
              />
              {nomeError && (
                <p className="text-sm text-destructive">
                  O nome do orçamento é obrigatório
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Exemplos: "Equipamentos de informática – TI", "Medicamentos – Atenção Básica"
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setNameDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmName} className="gap-2">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload com Animação Melhorada */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Planilha</DialogTitle>
            <DialogDescription>
              Orçamento: <span className="font-medium text-foreground">{nomeOrcamento}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!isLoading ? (
              /* Upload area */
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    <Upload className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Clique para selecionar o arquivo
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Arquivos suportados: .xlsx, .xls
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              /* Enhanced Loading Animation */
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-accent/50 animate-pulse flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                </div>
                
                <div className="w-full space-y-4">
                  <Progress value={progress} className="h-2" />
                  
                  <div className="space-y-3">
                    {loadingSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index === loadingStep;
                      const isComplete = index < loadingStep;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-3 transition-opacity duration-300 ${
                            isActive ? "opacity-100" : isComplete ? "opacity-50" : "opacity-30"
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isComplete ? "bg-success/20 text-success" : 
                            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {isComplete ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                            )}
                          </div>
                          <span className={`text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Processando: {fileName}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Revisão com Scroll */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Itens Encontrados
            </DialogTitle>
            <DialogDescription>
              {itensImportados.length} itens foram identificados na planilha. Revise antes de continuar.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-4">
              {itensImportados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm">
                        {item.nome}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.descricao}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-foreground">
                        {item.quantidade} {item.unidade}
                      </div>
                      {item.correspondencia && (
                        <div className="text-xs text-success mt-1">
                          {item.correspondencia}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleContinuarImportacao}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
