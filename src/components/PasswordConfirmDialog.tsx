import { useState } from "react";
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

interface PasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  confirmVariant?: "default" | "destructive" | "success";
}

export function PasswordConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  confirmVariant = "default",
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handleConfirm = () => {
    // Simulação: senha correta é "1234"
    if (password === "1234") {
      onConfirm();
      handleClose();
    } else {
      setPasswordError(true);
      toast.error("Senha incorreta");
    }
  };

  const handleClose = () => {
    setPassword("");
    setPasswordError(false);
    onOpenChange(false);
  };

  const getButtonClasses = () => {
    switch (confirmVariant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "success":
        return "bg-success text-success-foreground hover:bg-success/90";
      default:
        return "";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-password">Senha</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Digite sua senha para confirmar"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(false);
            }}
            className={passwordError ? "border-destructive" : ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
          />
          {passwordError && (
            <p className="text-sm text-destructive mt-1">Senha incorreta</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className={getButtonClasses()}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
