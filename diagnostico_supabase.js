import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Tenta carregar do .env se existir
try {
    const envFile = readFileSync('.env', 'utf8');
    const lines = envFile.split('\n');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
} catch (e) { }

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("--- INICIANDO DIAGNÓSTICO MÉDIA FÁCIL ---");

    // 1. Verificar conexão e usuários
    console.log("\n1. Verificando usuários na tabela pública...");
    const { data: users, error: uErr } = await supabase.from('usuarios').select('id, email, nome, entidade_id');
    if (uErr) {
        console.error("Erro ao ler usuários:", uErr.message);
    } else {
        console.table(users);
    }

    // 2. Verificar entidades
    console.log("\n2. Verificando entidades na tabela pública...");
    const { data: ents, error: eErr } = await supabase.from('entidades').select('id, nome');
    if (eErr) {
        console.error("Erro ao ler entidades:", eErr.message);
    } else {
        console.table(ents);
    }

    // 3. Verificar orçamentos (testar RLS anon)
    console.log("\n3. Verificando acesso a orçamentos (deve vir vazio se RLS ativo)...");
    const { data: orcs, error: oErr } = await supabase.from('orcamentos').select('id, nome, entidade_id');
    if (oErr) {
        console.error("Erro ao ler orçamentos:", oErr.message);
    } else {
        console.log(`Encontrados ${orcs?.length || 0} orçamentos.`);
    }

    console.log("\n--- FIM DO DIAGNÓSTICO ---");
}

diagnose();
