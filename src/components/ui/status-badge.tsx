import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { FileEdit, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        waiting_suppliers: "bg-info/10 text-info",
        completed: "bg-success/10 text-success",
        draft: "bg-warning/10 text-warning",
        deadline_expired: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
}

const statusLabels = {
  waiting_suppliers: "Aguardando Fornecedores",
  completed: "Finalizado",
  draft: "Rascunho",
  deadline_expired: "Prazo Encerrado",
};

const statusIcons = {
  waiting_suppliers: Clock,
  completed: CheckCircle2,
  draft: FileEdit,
  deadline_expired: AlertCircle,
};

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const Icon = statusIcons[status || "draft"];
  
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <Icon className="h-3 w-3" />
      {label || statusLabels[status || "draft"]}
    </span>
  );
}

// Status border colors for cards
export const statusBorderColors = {
  waiting_suppliers: "border-l-info",
  completed: "border-l-success", 
  draft: "border-l-warning",
  deadline_expired: "border-l-destructive",
};
