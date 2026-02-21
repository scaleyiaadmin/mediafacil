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
    const { user, profile } = useAuth();

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

            if (error) throw error;

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
            console.error('Erro ao buscar orçamentos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, profile?.entidade_id]);

    useEffect(() => {
        // Busca inicial
        fetchOrcamentos();

        // Automação: Polling de 2 em 2 segundos conforme pedido pelo usuário
        const intervalId = setInterval(() => {
            // Só busca se o usuário estiver ativo e não estiver em loading inicial
            if (user && profile?.entidade_id) {
                console.log("[useOrcamentos] Polling automático de 2s...");
                fetchOrcamentos();
            }
        }, 2000);

        return () => clearInterval(intervalId);
    }, [fetchOrcamentos, user, profile?.entidade_id]);

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
            console.error('Erro ao excluir orçamento:', err);
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
            if (!profile?.entidade_id) throw new Error("Entidade não identificada. Faça login novamente.");

            const entidadeId = profile.entidade_id;
            const usuarioId = user.id; // CORRETO: usar o ID do Auth, não do profile

            console.log("[createOrcamento] Salvando:", nome, "| entidade:", entidadeId, "| usuario:", usuarioId, "| itens:", itens.length);

            // 1. Criar o orçamento principal
            const { data: orcamento, error: orcamentoError } = await supabase
                .from('orcamentos')
                .insert({
                    nome,
                    status,
                    entidade_id: entidadeId,
                    usuario_id: usuarioId,
                    data_solicitacao: new Date().toISOString(),
                    links_enviados: fornecedores.length,
                    orcamentos_recebidos: 0
                })
                .select()
                .single();

            if (orcamentoError) {
                console.error("[createOrcamento] Erro ao criar orçamento:", orcamentoError);
                throw orcamentoError;
            }
            console.log("[createOrcamento] Orçamento criado com ID:", orcamento.id);

            // 2. Salvar os itens (aceita múltiplos formatos)
            if (itens.length > 0) {
                const itensToInsert = itens.map(item => ({
                    orcamento_id: orcamento.id,
                    nome: item.nome,
                    descricao: item.descricao || item.fonte || null,
                    unidade: item.unidade || 'UN',
                    quantidade: item.quantidade || 1,
                    // Aceita valor_referencia, media, preco ou valor
                    valor_referencia: item.valor_referencia ?? item.media ?? item.preco ?? item.valor ?? 0
                }));

                console.log("[createOrcamento] Inserindo", itensToInsert.length, "itens...");
                const { error: itensError } = await supabase
                    .from('orcamento_itens')
                    .insert(itensToInsert);

                if (itensError) {
                    console.error("[createOrcamento] Erro ao inserir itens:", itensError);
                    throw itensError;
                }
                console.log("[createOrcamento] Itens salvos com sucesso!");
            }

            // 3. Salvar vínculos de fornecedores
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
            fetchOrcamentos();
            return orcamento;

        } catch (err: any) {
            console.error('Erro ao salvar orçamento:', err);
            toast.error("Erro ao salvar orçamento: " + err.message);
            throw err;
        }
    };

    // NOVA FUNÇÃO: Duplicar um orçamento existente (busca itens do original e cria cópia)
    const duplicateOrcamento = async (id: string, novoNome: string) => {
        try {
            if (!profile?.entidade_id) throw new Error("Perfil não carregado.");

            // 1. Buscar orçamento original
            const { data: original, error: origErr } = await supabase
                .from('orcamentos')
                .select('*')
                .eq('id', id)
                .single();
            if (origErr) throw origErr;

            // 2. Buscar itens do original
            const { data: itensOriginais, error: itensErr } = await supabase
                .from('orcamento_itens')
                .select('*')
                .eq('orcamento_id', id);
            if (itensErr) throw itensErr;

            // 3. Criar novo orçamento como rascunho com o novo nome
            const { data: novoOrc, error: novoErr } = await supabase
                .from('orcamentos')
                .insert({
                    nome: novoNome || `Cópia de ${original.nome}`,
                    status: 'draft',
                    entidade_id: profile.entidade_id,
                    usuario_id: profile.id,
                    data_solicitacao: new Date().toISOString(),
                    links_enviados: 0,
                    orcamentos_recebidos: 0
                })
                .select()
                .single();
            if (novoErr) throw novoErr;

            // 4. Copiar itens para o novo orçamento
            if (itensOriginais && itensOriginais.length > 0) {
                const novoItens = itensOriginais.map(i => ({
                    orcamento_id: novoOrc.id,
                    nome: i.nome,
                    descricao: i.descricao,
                    unidade: i.unidade,
                    quantidade: i.quantidade,
                    valor_referencia: i.valor_referencia
                }));

                const { error: copyErr } = await supabase
                    .from('orcamento_itens')
                    .insert(novoItens);
                if (copyErr) throw copyErr;
            }

            toast.success("Orçamento duplicado com sucesso!", {
                description: `"${novoNome}" criado como rascunho.`
            });
            fetchOrcamentos();
            return novoOrc;

        } catch (err: any) {
            console.error('Erro ao duplicar orçamento:', err);
            toast.error("Erro ao duplicar: " + err.message);
            throw err;
        }
    };

    return { orcamentos, loading, error, refetch: fetchOrcamentos, deleteOrcamento, createOrcamento, duplicateOrcamento };
}
