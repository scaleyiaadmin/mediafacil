import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Copy, Trash2, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
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

type OrcamentoStatus = "waiting_suppliers" | "completed" | "draft" | "deadline_expired";

interface OrcamentoActionsProps {
  id: string;
  status: OrcamentoStatus;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onFinalize?: (id: string) => void;
  onResend?: (id: string) => void;
}

export function OrcamentoActions({ id, status, onDuplicate, onDelete, onFinalize, onResend }: OrcamentoActionsProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/orcamento/${id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === "draft") {
      navigate(`/buscar-itens-manual?edit=${id}`);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success("Orçamento duplicado com sucesso!", {
      description: "Datas e preços atualizados. Nova busca realizada.",
    });
    onDuplicate?.(id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleFinalizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFinalizeDialog(true);
  };

  const handleResendClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/solicitar-fornecedores?resend=${id}`);
    onResend?.(id);
  };

  const [isVerifying, setIsVerifying] = useState(false);

  const handleConfirmFinalize = async () => {
    try {
      setIsVerifying(true);
      // Verify password against database
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('senha', password)
        .limit(1);

      if (error) {
        console.error("Database error during password check:", error);
        toast.error("Erro ao acessar banco de dados. Verifique a tabela 'usuarios'.");
        return;
      }

      if (data && data.length > 0) {
        toast.success("Orçamento finalizado com sucesso!");
        onFinalize?.(id);
        setShowFinalizeDialog(false);
        setPassword("");
        setPasswordError(false);
      } else {
        // Diagnostic: Check if any users exist at all
        const { count } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });

        if (count === 0) {
          toast.error("A tabela de usuários está vazia. Rode o script SQL novamente.");
        } else {
          setPasswordError(true);
          toast.error("Senha incorreta");
        }
      }
    } catch (err: any) {
      console.error("Unexpected error verifying password:", err);
      toast.error("Erro inesperado ao verificar senha");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinalizeDialogClose = () => {
    setShowFinalizeDialog(false);
    setPassword("");
    setPasswordError(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsVerifying(true);
      // Verify password against database
      const { data, error: authError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('senha', password)
        .limit(1);

      if (authError) {
        console.error("Database error during password check:", authError);
        toast.error("Erro ao acessar banco de dados. Verifique o Supabase.");
        return;
      }

      if (data && data.length > 0) {
        // Call onDelete which usually triggers the hook's delete function
        onDelete?.(id);
        setShowDeleteDialog(false);
        setPassword("");
        setPasswordError(false);
      } else {
        // Diagnostic: Check if any users exist at all
        const { count } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });

        if (count === 0) {
          toast.error("Nenhum usuário cadastrado. Rode o script SQL no Supabase.");
        } else {
          setPasswordError(true);
          toast.error("Senha incorreta");
        }
      }
    } catch (err: any) {
      console.error("Unexpected error verifying password:", err);
      toast.error("Erro inesperado ao verificar senha");
    } finally {
      setIsVerifying(false);
    }
  };




  const handleDialogClose = () => {
    setShowDeleteDialog(false);
    setPassword("");
    setPasswordError(false);
  };

  const canFinalize = status === "waiting_suppliers" || status === "deadline_expired";
  const canResend = status === "deadline_expired";

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleView}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualizar</p>
          </TooltipContent>
        </Tooltip>

        {status === "draft" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        )}

        {canResend && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-info"
                onClick={handleResendClick}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reenviar Solicitação</p>
            </TooltipContent>
          </Tooltip>
        )}

        {canFinalize && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-success"
                onClick={handleFinalizeClick}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Finalizar Orçamento</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleDuplicate}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Duplicar</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Excluir</p>
          </TooltipContent>
        </Tooltip>

        {/* Finalize Confirmation Dialog with Password */}
        <AlertDialog open={showFinalizeDialog} onOpenChange={handleFinalizeDialogClose}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Orçamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja finalizar este orçamento? O relatório final será gerado com os dados atuais. Digite sua senha para confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="finalize-password">Senha</Label>
              <Input
                id="finalize-password"
                type="password"
                placeholder="Digite sua senha para confirmar"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                disabled={isVerifying}
                className={passwordError ? "border-destructive" : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmFinalize();
                  }
                }}
              />
              {passwordError && (
                <p className="text-sm text-destructive mt-1">Senha incorreta</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleFinalizeDialogClose} disabled={isVerifying}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmFinalize}
                className="bg-success text-success-foreground hover:bg-success/90"
                disabled={isVerifying}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={handleDialogClose}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Digite sua senha para confirmar a exclusão do orçamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                disabled={isVerifying}
                className={passwordError ? "border-destructive" : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmDelete();
                  }
                }}
              />
              {passwordError && (
                <p className="text-sm text-destructive mt-1">Senha incorreta</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDialogClose} disabled={isVerifying}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isVerifying}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
