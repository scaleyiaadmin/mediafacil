import pandas as pd
import os
import re

base_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil"
input_dir = os.path.join(base_path, "Planilhas_Itens")
output_dir = os.path.join(base_path, "Planilhas_Limpas")

def clean_catser():
    print("Processando CATSER...")
    path = os.path.join(input_dir, "Lista CATSER.xlsx")
    df_raw = pd.read_excel(path, header=None)
    
    data = []
    for i in range(3, len(df_raw)):
        row = df_raw.iloc[i]
        grupo = str(row[0]).strip()
        classe = str(row[1]).strip()
        
        # Coluna 2 costuma ser o código, e coluna 3 a descrição completa
        codigo = str(row[2]).strip()
        descricao = str(row[3]).strip() if len(row) > 3 else ""
        
        # Fallback: Se a descrição estiver vazia mas o código tiver letras, 
        # pode ser que o código e a descrição estejam juntos na coluna 2
        if (not descricao or descricao == 'nan') and codigo:
            match = re.match(r'^(\d+)\s*(.*)', codigo)
            if match:
                codigo_clean = match.group(1)
                descricao = match.group(2).strip()
                codigo = codigo_clean

        if codigo and codigo != 'nan' and len(codigo) > 1:
            data.append({
                'codigo': codigo,
                'descricao': descricao,
                'Grupo': grupo,
                'Classe': classe
            })
            
    df_final = pd.DataFrame(data)
    # Remover duplicatas e descrições vazias
    df_final = df_final.dropna(subset=['descricao'])
    df_final = df_final[df_final['descricao'] != 'nan']
    
    df_final.to_csv(os.path.join(output_dir, "catser_limpo.csv"), index=False, encoding='utf-8-sig')
    print(f"CATSER concluído: {len(df_final)} itens.")

def clean_cmed():
    print("Processando CMED...")
    path = os.path.join(input_dir, "Média Facil - CMED.xlsx")
    # CMED é gigante e bagunçado. Vamos ler sem cabeçalho e procurar a linha com dados
    # Média Facil - CMED.xlsx parece ter o cabeçalho espalhado
    df_raw = pd.read_excel(path, header=None, nrows=100)
    
    target_row = -1
    for i, row in df_raw.iterrows():
        row_str = " ".join(str(x).upper() for x in row.values)
        if 'EAN' in row_str and ('PRODUTO' in row_str or 'SUBST' in row_str):
            target_row = i
            break
    
    if target_row == -1:
        # Se não achou, pode ser que o arquivo CMED do usuário tenha outro nome ou formato
        # Vamos tentar ler a partir da linha 0 e ver o que tem
        print("Aviso: Cabeçalho EAN não encontrado nas primeiras 100 linhas. Tentando modo heurístico.")
        df = pd.read_excel(path)
    else:
        df = pd.read_excel(path, skiprows=target_row)

    print(f"Colunas lidas CMED: {df.columns.tolist()[:10]}...")
    
    # Mapeamento flexível
    mapping = {}
    for c in df.columns:
        cu = str(c).upper()
        if 'SUBST' in cu: mapping['substancia'] = c
        elif 'PRODUTO' in cu: mapping['produto'] = c
        elif 'EAN' in cu: mapping['ean'] = c
        elif 'FÁBRICA' in cu or ' PF ' in cu or cu.endswith(' PF'): mapping['pf'] = c
        elif 'PMVG' in cu: mapping['pmvg'] = c

    if 'ean' in mapping:
        df_final = df[list(mapping.values())].copy()
        df_final.columns = list(mapping.keys())
        df_final = df_final.dropna(subset=['ean'])
        # Limpar EAN para ser apenas números
        df_final['ean'] = df_final['ean'].astype(str).str.replace(r'\.0$', '', regex=True)
        df_final.to_csv(os.path.join(output_dir, "cmed_limpo.csv"), index=False, encoding='utf-8-sig')
        print(f"CMED concluído: {len(df_final)} itens.")
    else:
        print("Erro: Não consegui identificar a coluna EAN no CMED.")

# Rodar SINAPI separado pois já funcionou
clean_catser()
clean_cmed()
