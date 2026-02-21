
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwlbclurkhfnsztopeoj.supabase.co';
const supabaseKey = 'sb_publishable_5ATbbplIn-PbSyuB0gU87A_m2lawRWM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking database...");

    const { data: entidades, error: e1 } = await supabase.from('entidades').select('id, nome');
    if (e1) console.error("Error fetching entidades:", e1);
    console.log("Entidades:", JSON.stringify(entidades, null, 2));

    const { data: setores, error: e2 } = await supabase.from('setores').select('*');
    if (e2) console.error("Error fetching setores:", e2);
    console.log("Setores:", JSON.stringify(setores, null, 2));

    const { data: users, error: e3 } = await supabase.from('usuarios').select('email, entidade_id');
    if (e3) console.error("Error fetching usuarios:", e3);
    console.log("Usuarios:", JSON.stringify(users, null, 2));
}

check();
