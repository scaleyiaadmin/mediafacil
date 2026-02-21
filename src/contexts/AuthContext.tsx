import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface Usuario {
    id: string;
    nome: string;
    email: string;
    cargo?: string;
    setor?: string;
    entidade_id?: string;
    is_admin: boolean;
    tipo?: string;
}

interface Entidade {
    id: string;
    nome: string;
    cidade?: string;
    uf?: string;
}

interface AuthContextType {
    user: User | null;
    profile: Usuario | null;
    entidade: Entidade | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Usuario | null>(null);
    const [entidade, setEntidade] = useState<Entidade | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfileAndEntidade = async (supabaseUser: User) => {
        try {
            // 1. Fetch User Profile
            const { data: prof, error: profErr } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', supabaseUser.email)
                .single();

            if (profErr) {
                console.error("Erro ao buscar perfil:", profErr);
                return;
            }

            setProfile(prof);

            // 2. Fetch Entity Data
            if (prof.entidade_id) {
                const { data: ent, error: entErr } = await supabase
                    .from('entidades')
                    .select('*')
                    .eq('id', prof.entidade_id)
                    .single();

                if (entErr) {
                    console.error("Erro ao buscar entidade:", entErr);
                } else {
                    setEntidade(ent);
                }
            }
        } catch (err) {
            console.error("Erro inesperado no AuthContext:", err);
        }
    };

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfileAndEntidade(session.user);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await fetchProfileAndEntidade(currentUser);
            } else {
                setProfile(null);
                setEntidade(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setEntidade(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfileAndEntidade(user);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, entidade, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
};
