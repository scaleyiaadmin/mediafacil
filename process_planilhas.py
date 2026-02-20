import pandas as pd
import os
import re

base_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil"
input_dir = os.path.join(base_path, "Planilhas_Itens")
output_dir = os.path.join(base_path, "Planilhas_Limpas")

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def clean_catser():
    print("Processando CATSER...")
    path = os.path.join(input_dir, "Lista CATSER.xlsx")
    # Pelo debug, cabeçalho está na linha 2
    df = pd.read_excel(path, skiprows=2)
    
    # Renomear colunas
    # A coluna 'Codigo                Descrição' parece estar junta em alguns casos ou mal formatada
    # Vamos tentar identificar as colunas por posição se os nomes falharem
    df.columns = ['grupo', 'classe', 'codigo_descricao', 'extra']
    
    # Separar codigo e descrição se estiverem na mesma coluna
    # Ex: '15377                   INFRA-ESTRUTURA AEROPURTARIA'
    def split_code(val):
        if pd.isna(val): return None, None
        match = re.match(r'(\d+)\s+(.*)', str(val))
        if match:
            return match.group(1), match.group(2).strip()
        return None, str(val).strip()

    df[['codigo', 'descricao']] = df['codigo_descricao'].apply(lambda x: pd.Series(split_code(x)))
    
    df_final = df[['grupo', 'classe', 'codigo', 'descricao']].dropna(subset=['codigo'])
    df_final.to_csv(os.path.join(output_dir, "catser_limpo.csv"), index=False, encoding='utf-8-sig')
    print(f"CATSER concluído: {len(df_final)} itens.")

def clean_sinapi():
    print("Processando SINAPI...")
    path = os.path.join(input_dir, "SINAPI_mao_de_obra_2025_12.xlsx")
    # SINAPI costuma ter cabeçalho na linha 5
    df = pd.read_excel(path, skiprows=5)
    
    # Identificar colunas baseadas no padrão SINAPI
    # [DESCRICAO DA CLASSE, CODIGO, DESCRICAO, UNIDADE, PRECO_UF1, PRECO_UF2...]
    # Como o arquivo é "mão de obra", focar no código e descrição
    
    # Vou renomear as primeiras colunas conhecidas
    new_cols = list(df.columns)
    new_cols[0] = 'classe'
    new_cols[1] = 'codigo'
    new_cols[2] = 'descricao'
    new_cols[3] = 'unidade'
    df.columns = new_cols
    
    # Manter apenas essenciais + preços se existirem
    cols_to_keep = ['classe', 'codigo', 'descricao', 'unidade']
    # Adiciona colunas numéricas de preço (que costumam ser as UFs)
    for col in df.columns[4:]:
        if df[col].dtype in ['float64', 'int64']:
            cols_to_keep.append(col)
            
    df_final = df[cols_to_keep].dropna(subset=['codigo'])
    df_final.to_csv(os.path.join(output_dir, "sinapi_limpo.csv"), index=False, encoding='utf-8-sig')
    print(f"SINAPI concluído: {len(df_final)} itens.")

def clean_cmed():
    print("Processando CMED...")
    path = os.path.join(input_dir, "Média Facil - CMED.xlsx")
    # CMED é o mais complexo, vamos ler e tentar localizar 'SUBSTÂNCIA' ou 'PRODUTO'
    # No debug, parecia estar muito bagunçado. Vou ler tudo e filtrar linhas que tem EAN
    df = pd.read_excel(path, header=None)
    
    # Heurística: Procurar a linha que contém os nomes das colunas
    header_row = 0
    for i, row in df.iterrows():
        row_str = " ".join(str(x) for x in row.values)
        if 'SUBSTÂNCIA' in row_str.upper() and 'PRODUTO' in row_str.upper():
            header_row = i
            break
            
    df = pd.read_excel(path, skiprows=header_row)
    
    # Limpar nomes de colunas (remover quebras de linha e espaços extras)
    df.columns = [str(c).replace('\n', ' ').strip() for c in df.columns]
    
    # Colunas de interesse CMED padrão:
    # SUBSTÂNCIA, PRODUTO, APRESENTAÇÃO, EAN 1, PREÇO FÁBRICA, PMVG
    # Vou usar o que encontrar de similar
    cols = df.columns
    mapped = {}
    for c in cols:
        cu = c.upper()
        if 'SUBSTAN' in cu: mapped['substancia'] = c
        elif 'PRODUTO' in cu: mapped['produto'] = c
        elif 'APRESENTA' in cu: mapped['apresentacao'] = c
        elif 'EAN' in cu: mapped['ean'] = c
        elif 'FÁBRICA' in cu or 'PF' in cu: mapped['preco_fabrica'] = c
        elif 'PMVG' in cu: mapped['pmvg'] = c

    if mapped:
        df_final = df[list(mapped.values())].copy()
        df_final.columns = list(mapped.keys())
        # Remover lixo (linhas que não são medicamentos)
        df_final = df_final.dropna(subset=['ean', 'produto'])
        df_final.to_csv(os.path.join(output_dir, "cmed_limpo.csv"), index=False, encoding='utf-8-sig')
        print(f"CMED concluído: {len(df_final)} itens.")
    else:
        print("Erro: Não foi possível mapear as colunas do CMED.")

try:
    clean_catser()
except Exception as e:
    print(f"Falha CATSER: {e}")

try:
    clean_sinapi()
except Exception as e:
    print(f"Falha SINAPI: {e}")

try:
    clean_cmed()
except Exception as e:
    print(f"Falha CMED: {e}")

print("\nProcessamento finalizado!")
