import pandas as pd
import os

base_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil\Planilhas_Itens"

def analyze(file_name, skip=0):
    full_path = os.path.join(base_path, file_name)
    print(f"\n--- {file_name} ---")
    df = pd.read_excel(full_path, nrows=10, skiprows=skip)
    print("Colunas:")
    print(df.columns.tolist())
    print("Dados:")
    print(df.head(5).to_string())

# CMED costuma ter cabeçalho na linha 0 ou 1
analyze("Média Facil - CMED.xlsx", skip=0)

# SINAPI muitas vezes tem cabeçalho na linha 4 ou 5
analyze("SINAPI_mao_de_obra_2025_12.xlsx", skip=5)
