
import json
from collections import Counter
import os

# Caminho absoluto para o arquivo fornecedores.json
file_path = os.path.join(os.getcwd(), 'bancoDados', 'monitordespesas', 'congressoNacional', 'camaraDeputados', 'fornecedores.json')


try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("Erro: O arquivo JSON não contém uma lista de objetos.")
    else:
        ids = [item.get('id') for item in data if isinstance(item, dict) and 'id' in item]
        id_counts = Counter(ids)

        duplicates = {id_val: count for id_val, count in id_counts.items() if count > 1}

        if duplicates:
            print("IDs duplicados encontrados:")
            for id_val, count in duplicates.items():
                print(f"  ID: {id_val}, Ocorrências: {count}")
        else:
            print("Nenhum ID duplicado encontrado.")
except FileNotFoundError:
    print(f"Erro: Arquivo não encontrado em {file_path}")
except json.JSONDecodeError as e:
    print(f"Erro ao decodificar JSON: {e}")
except Exception as e:
    print(f"Ocorreu um erro inesperado: {e}")

