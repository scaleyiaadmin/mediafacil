from supabase import create_client, Client

url = "https://qwlbclurkhfnsztopeoj.supabase.co"
key = "sb_publishable_5ATbbplIn-PbSyuB0gU87A_m2lawRWM"
supabase: Client = create_client(url, key)

def check_table(table_name):
    print(f"\n--- Verificando {table_name} ---")
    try:
        res = supabase.table(table_name).select("*", count="exact").limit(3).execute()
        print(f"Total de registros: {res.count}")
        print("Amostra:")
        for r in res.data:
            print(r)
    except Exception as e:
        print(f"Erro ao verificar {table_name}: {e}")

check_table("referencia_catser")
check_table("referencia_sinapi")
check_table("referencia_cmed")
