import pandas as pd
import os

full_path = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil\Planilhas_Itens\Média Facil - CMED.xlsx"

print(f"\n--- DEBUG CMED ---")
try:
    # Lê as colunas para ver os nomes
    df = pd.read_excel(full_path, nrows=0)
    cols = df.columns.tolist()
    for i, col in enumerate(cols):
        print(f"{i}: {col}")
    
    # Lê as primeiras 5 linhas
    df_data = pd.read_excel(full_path, nrows=5)
    print("\nDados:")
    print(df_data.to_string())
except Exception as e:
    print(f"Error: {e}")
