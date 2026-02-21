import { createClient } from '@supabase/supabase-js';

// Hardcoded configs do ambiente fornecidas pelo contexto ou extraídas
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sua-url.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("--- INICIANDO DIAGNÓSTICO MÉDIA FÁCIL (V2) ---");

    try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Sessão Atual:", session ? `Ativa para ${session.user.email}` : "Inexistente");

        console.log("\n1. Verificando usuários na tabela pública...");
        const { data: users, error: uErr } = await supabase.from('usuarios').select('id, email, nome, entidade_id');
        if (uErr) console.error("Erro ao ler usuários:", uErr.message);
        else console.log("Usuários encontrados:", users.length);

        console.log("\n2. Verificando entidades na tabela pública...");
        const { data: ents, error: eErr } = await supabase.from('entidades').select('id, nome');
        if (eErr) console.error("Erro ao ler entidades:", eErr.message);
        else console.log("Entidades encontradas:", ents.length);

        // Teste de inserção de orçamento (vai falhar se RLS bloquear)
        console.log("\n3. Teste de inserção (RLS dry-run)...");
        if (users && users.length > 0) {
            const testUser = users[0];
            const { error: insErr } = await supabase.from('orcamentos').insert({
                nome: "Teste Diagnóstico",
                entidade_id: testUser.entidade_id,
                usuario_id: testUser.id,
                status: 'draft'
            });
            if (insErr) console.error("RLS Bloqueou o insert:", insErr.message);
            else console.log("Insert permitido (RLS OK)");
        }

    } catch (err) {
        console.error("Erro fatal no diagnóstico:", err);
    }

    console.log("\n--- FIM DO DIAGNÓSTICO ---");
}

diagnose();
