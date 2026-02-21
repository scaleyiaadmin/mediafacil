import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Copy, Trash2, CheckCircle, RefreshCw, Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useOrcamentos } from "@/hooks/useOrcamentos";

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";

interface OrcamentoActionsProps {
  id: string;
  nome: string;
  status: OrcamentoStatus;
  onDelete?: (id: string) => void;
  onFinalize?: (id: string) => void;
  onResend?: (id: string) => void;
}

export function OrcamentoActions({ id, nome, status, onDelete, onFinalize, onResend }: OrcamentoActionsProps) {
  const navigate = useNavigate();
  const { duplicateOrcamento } = useOrcamentos();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [novoNome, setNovoNome] = useState(`Cópia de ${nome}`);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigate(`/orcamento/${id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (status === "draft") navigate(`/buscar-itens-manual?edit=${id}`);
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setNovoNome(`Cópia de ${nome}`);
    setShowDuplicateDialog(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!novoNome.trim()) {
      toast.error("Informe um nome para o orçamento duplicado.");
      return;
    }
    setIsDuplicating(true);
    try {
      await duplicateOrcamento(id, novoNome.trim());
      setShowDuplicateDialog(false);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleFinalizeClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setShowFinalizeDialog(true);
  };

  const handleResendClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onResend?.(id);
  };

  const handleCestaClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsVerifying(true);
    try {
      const { data: items, error } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', id);

      if (error) throw error;

      const itensFormatados = (items || []).map(i => ({
        id: i.id,
        nome: i.nome,
        unidade: i.unidade || 'UN',
        quantidade: i.quantidade || 1,
        preco: Number(i.valor_referencia) || 0,
        fonte: i.descricao || 'Banco de Dados'
      }));

      navigate("/cesta-precos", {
        state: {
          orcamentoId: id,
          itensSelecionados: itensFormatados,
          nomeOrcamento: nome,
        }
      });
    } catch (err: any) {
      toast.error("Erro ao carregar cesta: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmFinalize = async () => {
    try {
      setIsVerifying(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('senha', password)
        .limit(1);

      if (error) { toast.error("Erro ao verificar senha."); return; }

      if (data && data.length > 0) {
        toast.success("Orçamento finalizado com sucesso!");
        onFinalize?.(id);
        setShowFinalizeDialog(false); setPassword(""); setPasswordError(false);
      } else {
        setPasswordError(true);
        toast.error("Senha incorreta");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsVerifying(true);
      const { data, error: authError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('senha', password)
        .limit(1);

      if (authError) { toast.error("Erro ao verificar senha."); return; }

      if (data && data.length > 0) {
        onDelete?.(id);
        setShowDeleteDialog(false); setPassword(""); setPasswordError(false);
      } else {
        setPasswordError(true);
        toast.error("Senha incorreta");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const canFinalize = status === "waiting_suppliers" || status === "deadline_expired";
  const canResend = status === "deadline_expired";

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
        {/* Ver */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleView}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Visualizar</p></TooltipContent>
        </Tooltip>

        {/* Editar (somente rascunho) */}
        {status === "draft" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Editar</p></TooltipContent>
          </Tooltip>
        )}

        {/* Reenviar */}
        {canResend && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-info" onClick={handleResendClick}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Reenviar Solicitação</p></TooltipContent>
          </Tooltip>
        )}

        {/* Finalizar */}
        {canFinalize && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-success" onClick={handleFinalizeClick}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Finalizar Orçamento</p></TooltipContent>
          </Tooltip>
        )}

        {/* Duplicar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleDuplicateClick}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Duplicar</p></TooltipContent>
        </Tooltip>

        {/* Cesta de Preços (somente finalizado) */}
        {status === "completed" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleCestaClick} disabled={isVerifying}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Ver Cesta de Preços</p></TooltipContent>
          </Tooltip>
        )}

        {/* Excluir */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Excluir</p></TooltipContent>
        </Tooltip>

        {/* Diálogo de Duplicação */}
        <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Duplicar Orçamento</AlertDialogTitle>
              <AlertDialogDescription>
                Será criada uma cópia com todos os itens do orçamento original como rascunho. Informe o nome para a cópia.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="duplicate-name">Nome do novo orçamento</Label>
              <Input
                id="duplicate-name"
                placeholder="Nome do orçamento duplicado"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                disabled={isDuplicating}
                className="mt-1.5"
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmDuplicate(); }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDuplicating}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDuplicate} disabled={isDuplicating}>
                {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Duplicar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de Finalização */}
        <AlertDialog open={showFinalizeDialog} onOpenChange={(open) => { setShowFinalizeDialog(open); if (!open) { setPassword(""); setPasswordError(false); } }}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Orçamento</AlertDialogTitle>
              <AlertDialogDescription>Confirme sua senha para finalizar o orçamento.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="finalize-password">Senha</Label>
              <Input id="finalize-password" type="password" placeholder="Digite sua senha" value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                disabled={isVerifying} className={passwordError ? "border-destructive mt-1.5" : "mt-1.5"}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmFinalize(); }} />
              {passwordError && <p className="text-sm text-destructive mt-1">Senha incorreta</p>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isVerifying}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmFinalize} className="bg-success text-success-foreground hover:bg-success/90" disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Finalizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de Exclusão */}
        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) { setPassword(""); setPasswordError(false); } }}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita. Digite sua senha para confirmar.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="Digite sua senha" value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                disabled={isVerifying} className={passwordError ? "border-destructive mt-1.5" : "mt-1.5"}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmDelete(); }} />
              {passwordError && <p className="text-sm text-destructive mt-1">Senha incorreta</p>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isVerifying}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
