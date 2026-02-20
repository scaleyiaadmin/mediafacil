import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ArrowRight, Loader2, Bell, Check, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcamentoCard } from "@/components/OrcamentoCard";
import { StatusFilterButtons } from "@/components/StatusFilterButtons";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { supabase } from "@/lib/supabase";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";
type FilterStatus = "all" | OrcamentoStatus;

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const { orcamentos, loading, deleteOrcamento } = useOrcamentos();

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter((orcamento) => {
      const matchesSearch = orcamento.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || orcamento.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, orcamentos]);

  const orcamentosExibidos = filteredOrcamentos.slice(0, 8);

  return (
    <MainLayout title="Dashboard" subtitle="Visão geral dos seus orçamentos">
      <div className="space-y-6">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/novo-orcamento">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Orçamento
              </Button>
            </Link>
          </div>

          {/* Orçamentos Recentes */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Orçamentos Recentes</h2>

              {/* Filtros e Busca */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <StatusFilterButtons
                  activeFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                />

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    className="pl-9 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Loading or Grid */}
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orcamentosExibidos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
                Nenhum orçamento encontrado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {orcamentosExibidos.map((orcamento) => (
                  <OrcamentoCard
                    key={orcamento.id}
                    id={orcamento.id}
                    nome={orcamento.nome}
                    dataSolicitacao={orcamento.dataSolicitacao}
                    dataFinalizacao={orcamento.dataFinalizacao}
                    status={orcamento.status}
                    linksEnviados={orcamento.linksEnviados}
                    orcamentosRecebidos={orcamento.orcamentosRecebidos}
                    onDelete={deleteOrcamento}
                  />
                ))}
              </div>
            )}

            {/* Ver todos */}
            <div className="flex justify-center pt-2">
              <Link to="/orcamentos">
                <Button variant="outline" className="gap-2">
                  Ver Todos os Orçamentos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
