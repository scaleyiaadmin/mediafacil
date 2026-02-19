import { FileText, Send, Inbox, Calendar, CheckCircle } from "lucide-react";
import { StatusBadge, statusBorderColors } from "@/components/ui/status-badge";
import { OrcamentoActions } from "@/components/OrcamentoActions";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";

interface OrcamentoCardProps {
  id: string;
  nome: string;
  dataSolicitacao: string;
  dataFinalizacao?: string;
  status: OrcamentoStatus;
  linksEnviados?: number;
  orcamentosRecebidos?: number;
  onDelete?: (id: string) => void;
}

export function OrcamentoCard({
  id,
  nome,
  dataSolicitacao,
  dataFinalizacao,
  status,
  linksEnviados,
  orcamentosRecebidos,
  onDelete,
}: OrcamentoCardProps) {
  return (
    <Card className={cn(
      "group hover:shadow-md transition-all hover:border-primary/30 border-l-4",
      statusBorderColors[status]
    )}>
      <CardContent className="p-4">
        {/* Header: Icon + Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
              {nome}
            </h3>
          </div>
        </div>

        {/* Status Badge with icon */}
        <div className="mb-3">
          <StatusBadge status={status} />
        </div>

        {/* Dates */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Criado: {dataSolicitacao}</span>
          </div>
          {dataFinalizacao && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>Finalizado: {dataFinalizacao}</span>
            </div>
          )}
        </div>

        {/* Supplier info (when applicable) */}
        {(linksEnviados !== undefined || orcamentosRecebidos !== undefined) && (
          <div className="flex items-center gap-3 mb-3 text-xs">
            {linksEnviados !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Send className="h-3 w-3" />
                <span>{linksEnviados} enviados</span>
              </div>
            )}
            {orcamentosRecebidos !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Inbox className="h-3 w-3" />
                <span>{orcamentosRecebidos} recebidos</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2 border-t border-border">
          <OrcamentoActions
            id={id}
            status={status}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
