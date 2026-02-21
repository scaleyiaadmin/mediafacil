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
    signIn: (email: string, password: string) => Promise<void>;
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
            console.log("AuthContext: Buscando perfil para", supabaseUser.email);

            // 1. Fetch User Profile
            const { data: prof, error: profErr } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', supabaseUser.email)
                .single();

            if (profErr || !prof) {
                console.error("AuthContext: Erro ao buscar perfil:", profErr);
                return;
            }

            setProfile(prof);
            console.log("AuthContext: Perfil carregado:", prof.nome, "Entidade ID:", prof.entidade_id);

            // Sincronizar metadados se necessário
            if (prof.entidade_id && supabaseUser.user_metadata?.entidade_id !== prof.entidade_id) {
                console.log("AuthContext: Sincronizando metadados da entidade...");
                await supabase.auth.updateUser({
                    data: { entidade_id: prof.entidade_id }
                });
            }

            // 2. Fetch Entity Data
            if (prof.entidade_id) {
                const { data: ent, error: entErr } = await supabase
                    .from('entidades')
                    .select('*')
                    .eq('id', prof.entidade_id)
                    .single();

                if (entErr) {
                    console.error("AuthContext: Erro ao buscar entidade:", entErr);
                } else {
                    console.log("AuthContext: Entidade carregada:", ent.nome);
                    setEntidade(ent);
                }
            } else {
                console.warn("AuthContext: Usuário sem entidade_id vinculada");
                setEntidade(null);
            }
        } catch (err) {
            console.error("AuthContext: Erro inesperado:", err);
        }
    };

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                await fetchProfileAndEntidade(currentUser);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setLoading(true); // Garante que rotas protegidas aguardem o processamento
            const currentUser = session?.user ?? null;

            // If user logged out or changed, reset profile first
            if (!currentUser) {
                setProfile(null);
                setEntidade(null);
                setUser(null);
                setLoading(false);
                return;
            }

            // If user logged in or is still same, update profile
            setUser(currentUser);
            await fetchProfileAndEntidade(currentUser);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            console.log("AuthProvider: Iniciando login para", email);

            // 1. Verificar se o usuário existe na tabela pública e conferir a senha
            const { data: dbUser, error: dbError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', email.trim())
                .single();

            if (dbError || !dbUser) {
                throw new Error("Usuário não encontrado em nossa base de dados.");
            }

            if (dbUser.senha !== password) {
                throw new Error("E-mail ou senha incorretos.");
            }

            // 2. Tentar login no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            let authenticatedUser = authData.user;

            // 3. Se falhar no Auth, tentar cadastro silencioso
            if (authError) {
                console.warn("AuthProvider: signIn falhou, tentando signUp silencioso:", authError.message);

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            nome: dbUser.nome,
                            entidade_id: dbUser.entidade_id,
                        }
                    }
                });

                if (signUpError) {
                    if (signUpError.message.includes("already registered")) {
                        throw new Error("Erro de sincronização. Sua senha na tabela não confere com o acesso seguro.");
                    }
                    throw signUpError;
                }
                authenticatedUser = signUpData.user;
            }

            if (authenticatedUser) {
                setUser(authenticatedUser);
                await fetchProfileAndEntidade(authenticatedUser);
            }
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setEntidade(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfileAndEntidade(user);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, entidade, loading, signIn, signOut, refreshProfile }}>
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
