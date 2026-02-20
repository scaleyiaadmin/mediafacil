import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("Iniciando processo de login para:", email);

            // 1. Verificar se o usuário existe na tabela pública e conferir a senha
            const { data: dbUser, error: dbError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', email)
                .single();

            if (dbError || !dbUser) {
                throw new Error("Usuário não encontrado em nossa base de dados.");
            }

            // Conferencia de senha simples (vulnerável, mas seguindo a lógica da tabela atual)
            if (dbUser.senha !== password) {
                throw new Error("E-mail ou senha incorretos.");
            }

            console.log("Usuário validado na tabela pública. Autenticando no Supabase Auth...");

            // 2. Tentar login no Supabase Auth
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            // 3. Se falhar no Auth (provavelmente usuário não existe no Auth), tentar cadastro silencioso
            if (authError) {
                console.warn("Falha no signInWithPassword, tentando signUp silencioso:", authError.message);

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nome: dbUser.nome,
                            entidade_id: dbUser.entidade_id,
                        }
                    }
                });

                if (signUpError) {
                    // Se o erro for de usuário já existe, e mesmo assim falhou o login, 
                    // pode ser uma discrepância de senhas entre a tabela e o auth.
                    if (signUpError.message.includes("already registered")) {
                        throw new Error("Erro de sincronização. Sua senha na tabela não confere com o acesso seguro. Contate o administrador.");
                    }
                    throw signUpError;
                }

                console.log("SignUp silencioso realizado.");
            }

            toast.success("Login realizado com sucesso!");
            navigate("/");
        } catch (error: any) {
            console.error("Erro no login:", error);
            toast.error(error.message || "Erro inesperado ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Média Fácil</h2>
                    <p className="text-slate-500 mt-2">Entre com suas credenciais para acessar o sistema</p>
                </div>

                <Card className="border-slate-200/60 shadow-xl">
                    <form onSubmit={handleLogin}>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl">Login</CardTitle>
                            <CardDescription>
                                Informe seu e-mail e senha cadastrados
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="exemplo@email.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Acessar Sistema"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
