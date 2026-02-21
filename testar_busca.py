import pandas as pd
import os

# Caminho da pasta onde os arquivos limpos foram gerados
output_dir = r"Planilhas_Limpas"

def carregar_dados():
    print("\n[Média Fácil] Carregando bases de dados de referência...")
    try:
        dados = {
            'CATSER': pd.read_csv(os.path.join(output_dir, "catser_limpo.csv")),
            'SINAPI': pd.read_csv(os.path.join(output_dir, "sinapi_limpo.csv")),
            'CMED': pd.read_csv(os.path.join(output_dir, "cmed_limpo.csv"))
        }
        print("Bases carregadas com sucesso!")
        print(f"- CATSER: {len(dados['CATSER'])} itens")
        print(f"- SINAPI: {len(dados['SINAPI'])} itens")
        print(f"- CMED: {len(dados['CMED'])} medicamentos")
        return dados
    except FileNotFoundError as e:
        print(f"\nErro: Certifique-se de que a pasta 'Planilhas_Limpas' contém os arquivos CSV. ({e})")
        return None

def buscar(termo, dados):
    termo = termo.lower().strip()
    if not termo: return
    
    print(f"\n" + "="*50)
    print(f"RESULTADOS PARA: '{termo.upper()}'")
    print("="*50)
    
    # Busca CATSER
    # Forçar conversão para string para evitar erro .str accessor
    df_catser = dados['CATSER'].copy()
    df_catser['descricao'] = df_catser['descricao'].astype(str)
    res_catser = df_catser[df_catser['descricao'].str.contains(termo, case=False, na=False)]
    
    print(f"\n[CATSER - Catálogo de Serviços/Materiais]")
    if not res_catser.empty:
        print(res_catser[['codigo', 'descricao']].head(5).to_string(index=False))
        if len(res_catser) > 5: print(f"... e mais {len(res_catser)-5} itens.")
    else:
        print("Nenhum item encontrado.")
    
    # Busca SINAPI
    df_sinapi = dados['SINAPI'].copy()
    df_sinapi['descricao'] = df_sinapi['descricao'].astype(str)
    res_sinapi = df_sinapi[df_sinapi['descricao'].str.contains(termo, case=False, na=False)]
    
    print(f"\n[SINAPI - Construção Civil]")
    if not res_sinapi.empty:
        cols = ['codigo', 'descricao', 'unidade']
        precos = [c for c in res_sinapi.columns if c not in cols and c not in ['classe']]
        if precos: cols.append(precos[0])

        print(res_sinapi[cols].head(5).to_string(index=False))
        if len(res_sinapi) > 5: print(f"... e mais {len(res_sinapi)-5} itens.")
    else:
        print("Nenhum item encontrado.")
    
    # Busca CMED (Medicamentos)
    df_cmed = dados['CMED'].copy()
    df_cmed['produto'] = df_cmed['produto'].astype(str)
    df_cmed['substancia'] = df_cmed['substancia'].astype(str)
    
    res_cmed = df_cmed[
        df_cmed['produto'].str.contains(termo, case=False, na=False) | 
        df_cmed['substancia'].str.contains(termo, case=False, na=False)
    ]
    
    print(f"\n[CMED - Medicamentos ANVISA]")
    if not res_cmed.empty:
        print(res_cmed[['produto', 'substancia', 'pmvg']].head(5).to_string(index=False))
        if len(res_cmed) > 5: print(f"... e mais {len(res_cmed)-5} itens.")
    else:
        print("Nenhum item medicinal encontrado.")

if __name__ == "__main__":
    bd = carregar_dados()
    if bd:
        print("\nDigite o termo da busca (Ex: Cimento, Dipirona, Limpeza) ou 'sair' para encerrar.")
        while True:
            try:
                entrada = input("\n🔍 Buscar: ")
                if entrada.lower() == 'sair':
                    print("Encerrando busca. Até logo!")
                    break
                buscar(entrada, bd)
            except KeyboardInterrupt:
                break
