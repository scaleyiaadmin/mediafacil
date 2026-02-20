import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrcamentoCard } from "@/components/OrcamentoCard";
import { StatusFilterButtons } from "@/components/StatusFilterButtons";
import { useOrcamentos } from "@/hooks/useOrcamentos";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";
type FilterStatus = "all" | OrcamentoStatus;

export default function ListaOrcamentos() {
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

  const handleDelete = (id: string) => {
    deleteOrcamento(id);
  };

  return (
    <MainLayout title="Todos os Orçamentos" subtitle="Gerencie seus orçamentos">
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

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Grid de Cards */}
            {filteredOrcamentos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
                Nenhum orçamento encontrado
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrcamentos.map((orcamento) => (
                  <OrcamentoCard
                    key={orcamento.id}
                    id={orcamento.id}
                    nome={orcamento.nome}
                    dataSolicitacao={orcamento.dataSolicitacao}
                    dataFinalizacao={orcamento.dataFinalizacao}
                    status={orcamento.status}
                    linksEnviados={orcamento.linksEnviados}
                    orcamentosRecebidos={orcamento.orcamentosRecebidos}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Contagem de resultados */}
        {!loading && (
          <div className="text-center text-sm text-muted-foreground">
            Exibindo {filteredOrcamentos.length} orçamento(s)
          </div>
        )}
      </div>
    </MainLayout>
  );
}

