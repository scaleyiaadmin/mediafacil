import pandas as pd
import os

files = [
    "Lista CATSER.xlsx",
    "Média Facil - CMED.xlsx",
    "SINAPI_mao_de_obra_2025_12.xlsx"
]

base_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil\Planilhas_Itens"

def analyze_file(file_name):
    full_path = os.path.join(base_path, file_name)
    print(f"\n{'='*20} {file_name} {'='*20}")
    try:
        xl = pd.ExcelFile(full_path)
        sheet_name = xl.sheet_names[0]
        print(f"Aba principal: {sheet_name}")
        
        # Lê as primeiras 20 linhas para encontrar o cabeçalho
        df_peek = pd.read_excel(full_path, sheet_name=sheet_name, nrows=20, header=None)
        
        # Tenta encontrar a linha que parece ser o cabeçalho
        # Uma heurística comum é a primeira linha que não tem muitos NaNs e tem nomes de colunas conhecidos
        header_idx = 0
        for i, row in df_peek.iterrows():
            non_null = row.count()
            if non_null > 2: # Se tem mais de 2 colunas preenchidas
                header_idx = i
                break
        
        print(f"Provável linha do cabeçalho: {header_idx}")
        
        # Lê novamente com o cabeçalho correto
        df = pd.read_excel(full_path, sheet_name=sheet_name, skiprows=header_idx, nrows=5)
        print("\nColunas Reais:")
        print(df.columns.tolist())
        print("\nExemplo de dados (5 linhas):")
        print(df.head(5).to_string(index=False))
        
    except Exception as e:
        print(f"Erro ao analisar {file_name}: {e}")

for f in files:
    analyze_file(f)
