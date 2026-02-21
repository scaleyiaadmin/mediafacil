import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

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
    const { user, profile, entidade } = useAuth();

    const fetchOrcamentos = useCallback(async () => {
        if (!user || !profile?.entidade_id) {
            setOrcamentos([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orcamentos')
                .select('*')
                .eq('entidade_id', profile.entidade_id)
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
                    orcamentosRecebidos: item.orcamentos_rece_bidos
                })));
            }
        } catch (err: any) {
            console.error('Error fetching orcamentos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, profile?.entidade_id]);

    useEffect(() => {
        fetchOrcamentos();
    }, [fetchOrcamentos]);

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
            if (!user) throw new Error("Usuário não autenticado.");
            if (!profile?.entidade_id) throw new Error("Aguardando carregamento do perfil...");

            const entidadeId = profile.entidade_id;
            const usuarioId = user.id;

            // 1. Insert Orcamento
            const { data: orcamento, error: orcamentoError } = await supabase
                .from('orcamentos')
                .insert({
                    nome,
                    status,
                    entidade_id: entidadeId,
                    usuario_id: usuarioId, // Auth ID
                    data_solicitacao: new Date().toISOString(),
                    links_enviados: fornecedores.length,
                    orcamentos_rece_bidos: 0
                })
                .select()
                .single();

            if (orcamentoError) throw orcamentoError;

            // 2. Insert Itens
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

            // 3. Insert Fornecedores Relations
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
