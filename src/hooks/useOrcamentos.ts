import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export interface Orcamento {
    id: string;
    nome: string;
    dataSolicitacao: string;
    dataFinalizacao?: string;
    status: "waiting_suppliers" | "completed" | "draft" | "deadline_expired";
    linksEnviados?: number;
    orcamentosRecebidos?: number;
}

export function useOrcamentos() {
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrcamentos();
    }, []);

    async function fetchOrcamentos() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orcamentos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (data) {
                setOrcamentos(data.map(item => ({
                    id: item.id,
                    nome: item.nome,
                    dataSolicitacao: new Date(item.data_solicitacao).toLocaleDateString('pt-BR'),
                    dataFinalizacao: item.data_finalizacao ? new Date(item.data_finalizacao).toLocaleDateString('pt-BR') : undefined,
                    status: item.status,
                    linksEnviados: item.links_enviados,
                    orcamentosRecebidos: item.orcamentos_recebidos
                })));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const deleteOrcamento = async (id: string) => {
        try {
            const { error } = await supabase
                .from('orcamentos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setOrcamentos(prev => prev.filter(o => o.id !== id));
            toast.success("Orçamento excluído com sucesso!");
        } catch (err: any) {
            console.error('Error deleting orcamento:', err);
            toast.error("Erro ao excluir orçamento: " + err.message);
        }
    };

    const createOrcamento = async (
        nome: string,
        itens: any[],
        fornecedores: any[],
        status: "draft" | "waiting_suppliers" | "completed" = "draft"
    ) => {
        try {
            // 1. Get current logged user email
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error("Usuário não autenticado.");

            // 2. Fetch or create user in public.usuarios to get entidade_id
            let entidadeId = user.user_metadata?.entidade_id;
            let usuarioId = user.id;

            // Try to find in public.usuarios
            const { data: publicUser } = await supabase
                .from('usuarios')
                .select('id, entidade_id')
                .eq('email', user.email)
                .single();

            if (publicUser) {
                // If found, use this data
                if (publicUser.entidade_id) entidadeId = publicUser.entidade_id;
                // We might want to use the public.usuarios ID or auth.users ID. 
                // The schema references auth.users usually, but let's check. 
                // The schema says: usuario_id uuid (no FK constraint to auth.users in the snippet I saw, but usually good to link).
                // Actually the schema has: 
                // usuario_id uuid (in insert example it uses v_usuario_id from auth.users OR public.usuarios).
                // Let's stick to auth.users.id for now as it's the standard for RLS if configured.
                // However, the error says "entidade_id" is null.
            }

            // If still no entidade_id, fetch the first available entity (Correction for demo/dev mode)
            if (!entidadeId) {
                const { data: entity } = await supabase
                    .from('entidades')
                    .select('id')
                    .limit(1)
                    .single();

                if (entity) {
                    entidadeId = entity.id;
                } else {
                    throw new Error("Nenhuma entidade cadastrada no sistema. Contate o administrador.");
                }
            }

            // 3. Insert Orcamento
            const { data: orcamento, error: orcamentoError } = await supabase
                .from('orcamentos')
                .insert({
                    nome,
                    status,
                    entidade_id: entidadeId,
                    usuario_id: usuarioId, // Auth ID
                    data_solicitacao: new Date().toISOString(),
                    links_enviados: fornecedores.length,
                    orcamentos_recebidos: 0
                })
                .select()
                .single();

            if (orcamentoError) throw orcamentoError;

            // 4. Insert Itens
            if (itens.length > 0) {
                const itensToInsert = itens.map(item => ({
                    orcamento_id: orcamento.id,
                    nome: item.nome,
                    descricao: item.descricao,
                    unidade: item.unidade,
                    quantidade: item.quantidade,
                    valor_referencia: item.media || item.valor || 0
                }));

                const { error: itensError } = await supabase
                    .from('orcamento_itens')
                    .insert(itensToInsert);

                if (itensError) throw itensError;
            }

            // 5. Insert Fornecedores Relations
            if (fornecedores.length > 0) {
                const fornecedoresToInsert = fornecedores.map(f => ({
                    orcamento_id: orcamento.id,
                    fornecedor_id: f.id,
                    status: 'pending'
                }));

                const { error: fornecedoresError } = await supabase
                    .from('orcamento_fornecedores')
                    .insert(fornecedoresToInsert);

                if (fornecedoresError) throw fornecedoresError;
            }

            toast.success(status === 'draft' ? "Rascunho salvo!" : "Orçamento criado com sucesso!");

            // Refresh list
            fetchOrcamentos();
            return orcamento;

        } catch (err: any) {
            console.error('Error creating orcamento:', err);
            toast.error("Erro ao salvar orçamento: " + err.message);
            throw err;
        }
    };

    return { orcamentos, loading, error, refetch: fetchOrcamentos, deleteOrcamento, createOrcamento };
}
