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
        // Se já terminou o loading inicial e ainda não tem user, redirecionamos (mesmo com flag)
        if (!loading) {
            console.log("ProtectedRoute: Falha na reidratação ou sessão expirada. Login necessário.");
            return <Navigate to="/login" state={{ from: location }} replace />;
        }

        // Se o usuário DEVERIA estar logado, mostramos a tela de reconexão apenas enquanto loading for true
        if (hasActiveSession) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">Reconectando à sua sessão...</p>
                </div>
            );
        }

        // Caso padrão (sem flag e sem user)
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
