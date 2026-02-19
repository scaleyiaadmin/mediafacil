import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
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
  itens: number;
  linksEnviados?: number;
  orcamentosRecebidos?: number;
}

const todosOrcamentos: Orcamento[] = [
  { id: "1", nome: "Material de escritório - Secretaria de Educação", dataSolicitacao: "10/01/2026", dataFinalizacao: "11/01/2026", status: "completed", itens: 15, linksEnviados: 8, orcamentosRecebidos: 5 },
  { id: "2", nome: "Equipamentos de informática - TI", dataSolicitacao: "09/01/2026", status: "waiting_suppliers", itens: 8, linksEnviados: 12, orcamentosRecebidos: 3 },
  { id: "3", nome: "Mobiliário escolar - Escola Municipal", dataSolicitacao: "08/01/2026", status: "draft", itens: 12 },
  { id: "4", nome: "Material de limpeza - Prefeitura", dataSolicitacao: "07/01/2026", status: "deadline_expired", itens: 20, linksEnviados: 6, orcamentosRecebidos: 2 },
  { id: "5", nome: "Medicamentos básicos - Saúde", dataSolicitacao: "06/01/2026", dataFinalizacao: "08/01/2026", status: "completed", itens: 45, linksEnviados: 15, orcamentosRecebidos: 10 },
  { id: "6", nome: "Uniformes escolares - Educação", dataSolicitacao: "05/01/2026", status: "draft", itens: 6 },
  { id: "7", nome: "Gêneros alimentícios - Merenda escolar", dataSolicitacao: "04/01/2026", dataFinalizacao: "06/01/2026", status: "completed", itens: 30, linksEnviados: 10, orcamentosRecebidos: 8 },
  { id: "8", nome: "Combustível - Frota municipal", dataSolicitacao: "03/01/2026", dataFinalizacao: "04/01/2026", status: "completed", itens: 3, linksEnviados: 5, orcamentosRecebidos: 4 },
  { id: "9", nome: "Materiais de construção - Obras", dataSolicitacao: "02/01/2026", status: "deadline_expired", itens: 25, linksEnviados: 20, orcamentosRecebidos: 7 },
  { id: "10", nome: "EPIs - Segurança do Trabalho", dataSolicitacao: "01/01/2026", status: "draft", itens: 18 },
  { id: "11", nome: "Veículos - Transporte Escolar", dataSolicitacao: "28/12/2025", dataFinalizacao: "02/01/2026", status: "completed", itens: 2, linksEnviados: 4, orcamentosRecebidos: 3 },
  { id: "12", nome: "Equipamentos médicos - UBS Central", dataSolicitacao: "27/12/2025", status: "waiting_suppliers", itens: 7, linksEnviados: 9, orcamentosRecebidos: 4 },
];

export default function ListaOrcamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [orcamentos, setOrcamentos] = useState(todosOrcamentos);

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
    setOrcamentos(prev => prev.filter(o => o.id !== id));
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

        {/* Contagem de resultados */}
        <div className="text-center text-sm text-muted-foreground">
          Exibindo {filteredOrcamentos.length} orçamento(s)
        </div>
      </div>
    </MainLayout>
  );
}
