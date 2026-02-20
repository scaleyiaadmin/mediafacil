import pandas as pd
import os
import re
from supabase import create_client, Client
import math

# Configurações do Supabase
url = "https://qwlbclurkhfnsztopeoj.supabase.co"
key = "sb_publishable_5ATbbplIn-PbSyuB0gU87A_m2lawRWM"
supabase: Client = create_client(url, key)

csv_dir = r"Planilhas_Limpas"

def clean_num(val):
    if pd.isna(val) or str(val).strip() == '': return None
    try:
        # Trata formato brasileiro: 1.234,56 -> 1234.56
        s = str(val).replace('.', '').replace(',', '.').replace('R$', '').strip()
        return float(s)
    except:
        return None

def clean_value(val):
    if pd.isna(val) or (isinstance(val, float) and math.isnan(val)):
        return None
    return val

def import_csv(file_name, table_name, mapping, is_numeric=None):
    path = os.path.join(csv_dir, file_name)
    if not os.path.exists(path):
        print(f"Erro: {file_name} não encontrado.")
        return

    print(f"\nImportando {file_name} para {table_name}...")
    df = pd.read_csv(path)
    
    records = []
    for _, row in df.iterrows():
        record = {}
        # Validação de descrição/produto
        desc = row.get('descricao') or row.get('produto')
        if pd.isna(desc) or str(desc).strip() == '':
            continue

        for csv_col, db_col in mapping.items():
            if csv_col in df.columns:
                val = row[csv_col]
                if is_numeric and db_col in is_numeric:
                    val = clean_num(val)
                else:
                    val = clean_value(val)
                record[db_col] = val
        
        if record:
            records.append(record)

    if not records:
        print(f"Nenhum registro válido em {file_name}")
        return

    batch_size = 100 # Menor para evitar erros de rede/timeout
    total = len(records)
    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        try:
            supabase.table(table_name).insert(batch).execute()
            print(f"Progresso: {min(i + batch_size, total)}/{total}", end='\r')
        except Exception as e:
            print(f"\nErro no lote {i} de {table_name}: {e}")
            break
    print(f"\n{table_name} concluído!")

# Mapeamentos
map_catser = {'codigo': 'codigo', 'descricao': 'descricao', 'Grupo': 'grupo', 'Classe': 'classe'}
map_sinapi = {'codigo': 'codigo', 'descricao': 'descricao', 'unidade': 'unidade'}
map_cmed = {'ean': 'ean', 'produto': 'produto', 'substancia': 'substancia', 'pf': 'pf', 'pmvg': 'pmvg'}

# SINAPI: Achar coluna de preço
try:
    df_sinapi = pd.read_csv(os.path.join(csv_dir, "sinapi_limpo.csv"))
    price_cols = [c for c in df_sinapi.columns if c not in ['codigo', 'descricao', 'unidade', 'classe']]
    if price_cols: map_sinapi[price_cols[0]] = 'preco_base'
except: pass

# Limpar tabelas antes de re-importar (Opcional, mas seguro para teste)
print("Limpando tabelas para nova importação...")
supabase.table("referencia_catser").delete().neq("codigo", "0").execute()
supabase.table("referencia_sinapi").delete().neq("codigo", "0").execute()
supabase.table("referencia_cmed").delete().neq("produto", "").execute()

import_csv("catser_limpo.csv", "referencia_catser", map_catser)
import_csv("sinapi_limpo.csv", "referencia_sinapi", map_sinapi, is_numeric=['preco_base'])
import_csv("cmed_limpo.csv", "referencia_cmed", map_cmed, is_numeric=['pf', 'pmvg'])

# Mapeamentos (Coluna CSV -> Coluna Banco)
map_catser = {
    'codigo': 'codigo',
    'descricao': 'descricao',
    'Grupo': 'grupo',
    'Classe': 'classe'
}

map_sinapi = {
    'codigo': 'codigo',
    'descricao': 'descricao',
    'unidade': 'unidade'
    # 'precos...' - Vamos pegar o primeiro preço numérico se houver
}

map_cmed = {
    'ean': 'ean',
    'produto': 'produto',
    'substancia': 'substancia',
    'pf': 'pf',
    'pmvg': 'pmvg'
}

# Pegar preço base para SINAPI (ajuste manual de coluna se necessário)
df_sinapi = pd.read_csv(os.path.join(csv_dir, "sinapi_limpo.csv"))
num_cols = df_sinapi.select_dtypes(include=['float64', 'int64']).columns
if len(num_cols) > 1: # código é numérico no SINAPI, então o preço é a segunda ou além
    price_col = [c for c in num_cols if c != 'codigo'][0]
    map_sinapi[price_col] = 'preco_base'

# Executar importações
import_csv("catser_limpo.csv", "referencia_catser", map_catser)
import_csv("sinapi_limpo.csv", "referencia_sinapi", map_sinapi)
import_csv("cmed_limpo.csv", "referencia_cmed", map_cmed)

print("\nImportação finalizada!")
