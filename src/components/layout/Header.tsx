import { User, Settings, LogOut, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { profile, entidade, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const iniciais = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6">
      <div className="flex-1">
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {entidade && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-border">
            <Building2 className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{entidade.nome}</span>
          </div>
        )}

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 flex items-center gap-3 px-2 hover:bg-accent/50 rounded-full transition-all">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-sm">
                {iniciais}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold leading-none text-foreground">{profile?.nome || "Usuário"}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{profile?.cargo || "Membro"}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1">
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold">{profile?.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/perfil-configuracoes")} className="gap-2 cursor-pointer py-2.5">
              <Settings className="h-4 w-4" />
              <span>Perfil e Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive gap-2 cursor-pointer py-2.5">
              <LogOut className="h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
