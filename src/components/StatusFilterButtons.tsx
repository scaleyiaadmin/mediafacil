import { Button } from "@/components/ui/button";

type FilterStatus = "all" | "draft" | "waiting_suppliers" | "deadline_expired" | "completed";

interface StatusFilterButtonsProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

const filters: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "waiting_suppliers", label: "Aguardando Fornecedores" },
  { value: "deadline_expired", label: "Prazo Encerrado" },
  { value: "completed", label: "Finalizado" },
];

export function StatusFilterButtons({ activeFilter, onFilterChange }: StatusFilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className="transition-all"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
