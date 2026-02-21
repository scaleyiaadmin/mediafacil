import pandas as pd
import os

output_dir = r"c:\Users\freir\OneDrive\Área de Trabalho\Sistemas 2026\Média Fácil\Planilhas_Limpas"

def validate(file_name):
    path = os.path.join(output_dir, file_name)
    print(f"\n--- Amostra: {file_name} ---")
    if os.path.exists(path):
        df = pd.read_csv(path)
        print(f"Total de linhas: {len(df)}")
        print("Colunas:", df.columns.tolist())
        print("Primeiras 3 linhas:")
        print(df.head(3).to_string(index=False))
    else:
        print(f"Erro: {file_name} não encontrado.")

validate("catser_limpo.csv")
validate("sinapi_limpo.csv")
validate("cmed_limpo.csv")
