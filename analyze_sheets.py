import pandas as pd
import os

files = [
    "Lista CATSER.xlsx",
    "Média Facil - CMED.xlsx",
    "SINAPI_mao_de_obra_2025_12.xlsx"
]

base_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil\Planilhas_Itens"

for file in files:
    full_path = os.path.join(base_path, file)
    print(f"\n--- Analisando: {file} ---")
    try:
        # Pega os nomes das abas
        xl = pd.ExcelFile(full_path)
        print(f"Abas: {xl.sheet_names}")
        
        # Lê a primeira aba (geralmente a principal)
        df = pd.read_excel(full_path, sheet_name=0, nrows=10)
        print("Colunas encontradas:")
        print(df.columns.tolist())
        print("\nPrimeiras 5 linhas:")
        print(df.head(5))
    except Exception as e:
        print(f"Erro ao ler {file}: {e}")
