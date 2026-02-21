import pandas as pd
import os

base_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil\Planilhas_Itens"

def debug_file(file_name):
    full_path = os.path.join(base_path, file_name)
    print(f"\n{'='*10} DEBUG: {file_name} {'='*10}")
    try:
        # Lê sem cabeçalho e apenas as primeiras 30 linhas
        df = pd.read_excel(full_path, header=None, nrows=30)
        for i, row in df.iterrows():
            print(f"Row {i}: {row.tolist()[:8]}") # Primeiras 8 colunas
    except Exception as e:
        print(f"Error: {e}")

debug_file("Lista CATSER.xlsx")
debug_file("Média Facil - CMED.xlsx")
debug_file("SINAPI_mao_de_obra_2025_12.xlsx")
