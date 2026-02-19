import { Wrench, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportMode } from "@/contexts/SupportModeContext";
import { useNavigate } from "react-router-dom";

export function SupportModeBanner() {
  const { isSupportMode, supportUser, exitSupportMode } = useSupportMode();
  const navigate = useNavigate();

  if (!isSupportMode || !supportUser) {
    return null;
  }

  const handleExitSupportMode = () => {
    exitSupportMode();
    navigate("/admin/usuarios");
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-destructive px-4 py-2 text-destructive-foreground">
      <div className="flex items-center gap-3">
        <Wrench className="h-5 w-5" />
        <span className="font-medium">
          Modo Suporte — Acessando: {supportUser.nome} | {supportUser.entidade}
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={handleExitSupportMode}
      >
        <LogOut className="h-4 w-4" />
        Sair do modo suporte
      </Button>
    </div>
  );
}
