import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Database, Power, Settings, Calendar, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Tabela {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  status: "ativo" | "inativo";
  ultimaAtualizacao: string;
  registros: number;
  fonte: string;
}

const tabelasData: Tabela[] = [
  {
    id: "1",
    nome: "Portal Nacional de Contratações Públicas",
    sigla: "PNCP",
    descricao: "Base de dados oficial de contratações públicas do governo federal",
    status: "ativo",
    ultimaAtualizacao: "13/01/2026",
    registros: 2456789,
    fonte: "gov.br/pncp",
  },
  {
    id: "2",
    nome: "Banco de Preços em Saúde",
    sigla: "BPS",
    descricao: "Sistema de consulta de preços praticados na área da saúde",
    status: "ativo",
    ultimaAtualizacao: "12/01/2026",
    registros: 987654,
    fonte: "bps.saude.gov.br",
  },
  {
    id: "3",
    nome: "Painel de Preços",
    sigla: "PP",
    descricao: "Ferramenta de pesquisa de preços do Ministério da Economia",
    status: "ativo",
    ultimaAtualizacao: "11/01/2026",
    registros: 1234567,
    fonte: "paineldeprecos.planejamento.gov.br",
  },
  {
    id: "4",
    nome: "Notas Fiscais Eletrônicas",
    sigla: "NFe",
    descricao: "Base de notas fiscais eletrônicas de produtos e serviços",
    status: "ativo",
    ultimaAtualizacao: "13/01/2026",
    registros: 5678901,
    fonte: "nfe.fazenda.gov.br",
  },
  {
    id: "5",
    nome: "Compras Governamentais",
    sigla: "CG",
    descricao: "Portal de compras do governo federal (legado)",
    status: "inativo",
    ultimaAtualizacao: "01/12/2025",
    registros: 456789,
    fonte: "comprasgovernamentais.gov.br",
  },
];

export default function AdminTabelas() {
  const [tabelas, setTabelas] = useState(tabelasData);

  const toggleStatus = (id: string) => {
    setTabelas((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "ativo" ? "inativo" : "ativo" }
          : t
      )
    );
    toast.success("Status da tabela atualizado!");
  };

  const handleSync = (tabela: Tabela) => {
    toast.info(`Sincronizando ${tabela.sigla}...`, {
      description: "Isso pode levar alguns minutos",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  return (
    <MainLayout title="Gestão de Tabelas" subtitle="Gerenciar tabelas de preços do sistema">
      <div className="space-y-6">
        {/* Back button */}
        <Link to="/admin">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </Button>
        </Link>

        {/* Info */}
        <div className="rounded-lg border border-info/30 bg-info/5 p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tabelas de preços</strong> são as fontes de dados utilizadas para busca automática de preços. 
            Você pode ativar ou desativar tabelas para controlar quais fontes ficam disponíveis para os clientes.
          </p>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {tabelas.map((tabela) => (
            <Card key={tabela.id} className={tabela.status === "inativo" ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      tabela.status === "ativo" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tabela.sigla}</CardTitle>
                      <Badge variant={tabela.status === "ativo" ? "default" : "outline"} className="mt-1">
                        {tabela.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={tabela.status === "ativo"}
                    onCheckedChange={() => toggleStatus(tabela.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{tabela.descricao}</CardDescription>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Última atualização
                    </span>
                    <span className="font-medium text-foreground">{tabela.ultimaAtualizacao}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Registros</span>
                    <span className="font-medium text-foreground">{formatNumber(tabela.registros)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fonte</span>
                    <span className="text-xs text-primary">{tabela.fonte}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleSync(tabela)}>
                    <RefreshCw className="h-3 w-3" />
                    Sincronizar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-3 w-3" />
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
