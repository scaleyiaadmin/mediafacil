import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Validando sua sessão...</p>
            </div>
        );
    }

    const hasActiveSession = localStorage.getItem('mf_auth_active') === 'true';

    // Se não há usuário logado
    if (!user) {
        // Se o usuário DEVERIA estar logado (não clicou em Sair), esperamos ou tentamos recuperar
        // Mas se o AuthContext já terminou o loading e não achou ninguém, e não há flag, redirecionamos.
        if (!hasActiveSession) {
            console.log("ProtectedRoute: Sessão não ativa e flag de persistência ausente. Redirecionando para login.");
            return <Navigate to="/login" state={{ from: location }} replace />;
        }

        // Se há flag mas o user é null após o loading, algo deu errado na reidratação
        // Vamos dar uma última chance mostrando o loading em vez de expulsar
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Reconectando à sua sessão...</p>
            </div>
        );
    }

    return <>{children}</>;
};
