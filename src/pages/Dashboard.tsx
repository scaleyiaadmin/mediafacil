import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrcamentoCard } from "@/components/OrcamentoCard";
import { StatusFilterButtons } from "@/components/StatusFilterButtons";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";
type FilterStatus = "all" | OrcamentoStatus;

interface Orcamento {
  id: string;
  nome: string;
  dataSolicitacao: string;
  dataFinalizacao?: string;
  status: OrcamentoStatus;
  linksEnviados?: number;
  orcamentosRecebidos?: number;
}

const orcamentosRecentes: Orcamento[] = [
  { id: "1", nome: "Material de escritório - Secretaria de Educação", dataSolicitacao: "10/01/2026", dataFinalizacao: "11/01/2026", status: "completed", linksEnviados: 8, orcamentosRecebidos: 5 },
  { id: "2", nome: "Equipamentos de informática - TI", dataSolicitacao: "09/01/2026", status: "waiting_suppliers", linksEnviados: 12, orcamentosRecebidos: 3 },
  { id: "3", nome: "Mobiliário escolar - Escola Municipal", dataSolicitacao: "08/01/2026", status: "draft" },
  { id: "4", nome: "Material de limpeza - Prefeitura", dataSolicitacao: "07/01/2026", status: "deadline_expired", linksEnviados: 6, orcamentosRecebidos: 2 },
  { id: "5", nome: "Medicamentos básicos - Saúde", dataSolicitacao: "06/01/2026", dataFinalizacao: "08/01/2026", status: "completed", linksEnviados: 15, orcamentosRecebidos: 10 },
  { id: "6", nome: "Uniformes escolares - Educação", dataSolicitacao: "05/01/2026", status: "draft" },
  { id: "7", nome: "Gêneros alimentícios - Merenda escolar", dataSolicitacao: "04/01/2026", dataFinalizacao: "06/01/2026", status: "completed", linksEnviados: 10, orcamentosRecebidos: 8 },
  { id: "8", nome: "Combustível - Frota municipal", dataSolicitacao: "03/01/2026", dataFinalizacao: "04/01/2026", status: "completed", linksEnviados: 5, orcamentosRecebidos: 4 },
  { id: "9", nome: "Materiais de construção - Obras", dataSolicitacao: "02/01/2026", status: "deadline_expired", linksEnviados: 20, orcamentosRecebidos: 7 },
  { id: "10", nome: "EPIs - Segurança do Trabalho", dataSolicitacao: "01/01/2026", status: "draft" },
];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [orcamentos, setOrcamentos] = useState(orcamentosRecentes);

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

  // Limitar a 8 cards no dashboard
  const orcamentosExibidos = filteredOrcamentos.slice(0, 8);

  const handleDelete = (id: string) => {
    setOrcamentos(prev => prev.filter(o => o.id !== id));
  };

  return (
    <MainLayout title="Dashboard" subtitle="Bem-vindo ao Média Fácil">
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

          {/* Grid de Cards - 4x2 */}
          {orcamentosExibidos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
              Nenhum orçamento encontrado
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  onDelete={handleDelete}
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
    </MainLayout>
  );
}
