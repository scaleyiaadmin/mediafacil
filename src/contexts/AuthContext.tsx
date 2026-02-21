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

            // Busca o perfil e os dados da entidade em uma única query (JOIN)
            const { data: prof, error: profErr } = await supabase
                .from('usuarios')
                .select('*, entidades(*)')
                .eq('email', supabaseUser.email)
                .single();

            if (profErr || !prof) {
                console.error("AuthContext: Erro ao buscar perfil:", profErr?.message);
                return;
            }

            // Separar os dados de entidade dos do perfil
            const entidadeData = (prof as any).entidades || null;
            const profileData = { ...prof };
            delete (profileData as any).entidades;

            setProfile(profileData);
            console.log("AuthContext: Perfil carregado:", prof.nome, "| Entidade ID:", prof.entidade_id);

            if (entidadeData) {
                console.log("AuthContext: Entidade carregada via JOIN:", entidadeData.nome);
                setEntidade(entidadeData);
            } else {
                console.warn("AuthContext: Entidade não retornada pelo JOIN. Verificar se entidade_id está preenchido no banco.");
                setEntidade(null);
            }

            // Sincronizar metadados do Auth se necessário
            if (prof.entidade_id && supabaseUser.user_metadata?.entidade_id !== prof.entidade_id) {
                await supabase.auth.updateUser({ data: { entidade_id: prof.entidade_id } });
            }
        } catch (err) {
            console.error("AuthContext: Erro inesperado:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const handleAuthChange = async (session: any) => {
            const currentUser = session?.user ?? null;

            if (!currentUser) {
                if (isMounted) {
                    setProfile(null);
                    setEntidade(null);
                    setUser(null);
                    setLoading(false);
                }
                return;
            }

            if (isMounted) {
                setUser(currentUser);
                await fetchProfileAndEntidade(currentUser);
                setLoading(false);
            }
        };

        // Escuta mudanças no estado de autenticação
        // O Supabase dispara o evento INITIAL_SESSION (ou similar) logo no início
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log("AuthContext: Evento de auth recebido:", _event);
            await handleAuthChange(session);
        });

        // Fallback: se o listener demorar, tenta pegar a sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && loading) {
                handleAuthChange(session);
            } else if (!session) {
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
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
