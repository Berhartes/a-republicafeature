# 🎓 Resumo Simples: O Que Precisa Ser Feito

> **Para desenvolvedores que querem entender rápido o plano**

---

## 🤔 Qual é o Problema?

### O Que Já Funciona ✅

Quando você roda o ETL agora, ele **salva os dados separados por ano**:

```
bancoDados/monitordespesas/deputadosFederais/74646/
├── 74646-id57-2022-dados_completos.json  ← Só dados de 2022
├── 74646-id57-2023-dados_completos.json  ← Só dados de 2023
├── 74646-id57-2024-dados_completos.json  ← Só dados de 2024
└── 74646-id57-2025-dados_completos.json  ← Só dados de 2025
```

**Isso é ÓTIMO!** Porque agora você pode atualizar só 2025 sem reprocessar tudo.

### O Que Está Quebrado ❌

Mas tem um problema: **a materialização ainda procura o arquivo antigo!**

```python
# materialize_unified_v2.py linha 119
data_file = deputy_dir / 'dados_completos.json'  # ❌ Arquivo antigo!
```

Esse arquivo **não existe mais**! Agora temos 4 arquivos (um por ano).

**Resultado:** Materialização não encontra os dados e não gera os caches para o frontend.

---

## 💡 A Solução (Em Palavras Simples)

### Passo 1: Ensinar a Materialização a Ler os Novos Arquivos

**O que fazer:**
Criar uma função que:
1. Procura todos os arquivos por ano: `74646-id57-*-dados_completos.json`
2. Lê cada arquivo
3. Junta tudo em um único objeto

**Analogia:**
É como ter 4 cadernos (um por ano) e precisar juntar tudo em um relatório final.

```python
# Antes (quebrado)
dados = ler_arquivo("dados_completos.json")  # ❌ Não existe

# Depois (funciona)
dados_2022 = ler_arquivo("74646-id57-2022-dados_completos.json")
dados_2023 = ler_arquivo("74646-id57-2023-dados_completos.json")
dados_2024 = ler_arquivo("74646-id57-2024-dados_completos.json")
dados_2025 = ler_arquivo("74646-id57-2025-dados_completos.json")

dados_completos = juntar_tudo(dados_2022, dados_2023, dados_2024, dados_2025)
```

### Passo 2: Fazer Materialização Ser Inteligente (Incremental)

**O que fazer:**
Fazer a materialização só processar o que mudou.

**Como funciona:**
1. Compara data de modificação dos arquivos fonte com os caches
2. Se o cache está mais novo que a fonte, pula (não precisa refazer)
3. Se a fonte está mais nova, reprocessa

**Analogia:**
É como só lavar a louça suja, não toda a louça da casa.

```python
# Verifica se precisa rematerializar
if arquivo_fonte_mais_novo_que_cache:
    rematerializar()  # Precisa atualizar
else:
    pular()  # Cache está atualizado, não faz nada
```

### Passo 3: Validar que o Frontend Funciona

**O que fazer:**
Verificar se os caches gerados têm o formato que o frontend espera.

**O que o frontend precisa:**
```json
{
  "deputados": [
    {
      "id": 74646,
      "gastosPorAno": {
        "2022": 100000,
        "2023": 120000,
        "2024": 150000,
        "2025": 50000
      }
    }
  ]
}
```

---

## 🎯 O Que Você Vai Fazer (Passo a Passo)

### Tarefa 1: Criar Função de Leitura (2 horas)

**Arquivo:** `materialize_helpers.py` (novo)

**O que faz:**
- Procura todos os arquivos por ano de um deputado
- Lê cada arquivo
- Junta tudo em um objeto só

**Código simplificado:**
```python
def ler_dados_deputado_por_ano(pasta_deputado):
    # 1. Procura arquivos: 74646-id57-2022-dados_completos.json, etc.
    arquivos = procurar_arquivos_por_ano(pasta_deputado)
    
    # 2. Lê cada arquivo
    todos_dados = []
    for arquivo in arquivos:
        dados_ano = ler_json(arquivo)
        todos_dados.append(dados_ano)
    
    # 3. Junta tudo
    dados_completos = juntar_dados(todos_dados)
    
    return dados_completos
```

### Tarefa 2: Atualizar Materialização (2 horas)

**Arquivos:** `materialize_unified_v2.py` e `materialize_paginated.py`

**O que fazer:**
Trocar a linha que lê o arquivo antigo pela nova função.

**Antes:**
```python
data_file = deputy_dir / 'dados_completos.json'  # ❌
with open(data_file) as f:
    deputy_data = json.load(f)
```

**Depois:**
```python
deputy_data = ler_dados_deputado_por_ano(deputy_dir)  # ✅
```

### Tarefa 3: Adicionar Modo Incremental (2 horas)

**Arquivo:** `materialize_paginated.py`

**O que fazer:**
Adicionar flag `--incremental` que só processa o que mudou.

**Como usar:**
```bash
# Modo completo (processa tudo)
py -m etlpython.cli.materialize_paginated

# Modo incremental (só o que mudou)
py -m etlpython.cli.materialize_paginated --incremental
```

### Tarefa 4: Testar Tudo (2 horas)

**Testes:**

1. **Rodar ETL completo:**
   ```bash
   py -m etlpython...cli 57 10 --ano-inicio 2022 --ano-fim 2025
   ```
   Verifica se cria os 4 arquivos por ano.

2. **Rodar materialização:**
   ```bash
   pnpm run etl:materialize:all
   ```
   Verifica se gera os caches corretamente.

3. **Rodar frontend:**
   ```bash
   cd packages/monitor-despesas-next
   pnpm dev
   ```
   Verifica se os dados aparecem na tela.

---

## 📊 Por Que Isso é Importante?

### Antes (Sem Otimização)

```
Atualização diária:
1. ETL processa TUDO (2022, 2023, 2024, 2025) = 20 minutos
2. Materialização processa TUDO = 5 minutos
Total: 25 minutos
```

### Depois (Com Otimização)

```
Atualização diária:
1. ETL processa SÓ 2025 = 2 minutos
2. Materialização processa SÓ o que mudou = 30 segundos
Total: 3 minutos
```

**Ganho:** De 25 minutos para 3 minutos! (88% mais rápido) 🚀

---

## 🎯 Resumo Ultra Simples

### O Problema
- ETL salva dados por ano (novo formato) ✅
- Materialização procura arquivo antigo (formato antigo) ❌
- Frontend não recebe dados ❌

### A Solução
1. Criar função que lê os novos arquivos por ano
2. Atualizar materialização para usar essa função
3. Adicionar modo incremental (só processa o que mudou)
4. Testar tudo

### O Resultado
- Frontend recebe dados ✅
- Atualização diária 88% mais rápida ✅
- Pode processar mais deputados ✅

---

## 🚀 Próximo Passo

**Começar pela Tarefa 1:** Criar `materialize_helpers.py`

Essa é a base de tudo. Depois que essa função funcionar, o resto é só trocar as chamadas antigas pelas novas.

---

## ❓ Dúvidas Comuns

**P: Por que não voltar ao formato antigo (um arquivo só)?**  
R: Porque o formato novo permite atualizar só o ano atual, economizando 90% do tempo.

**P: E se eu quiser todos os dados de uma vez?**  
R: A função `ler_dados_deputado_por_ano()` já junta tudo automaticamente!

**P: O frontend vai quebrar?**  
R: Não! A materialização gera os mesmos caches de antes, só lê de arquivos diferentes.

**P: Quanto tempo vai levar para implementar?**  
R: ~8 horas de trabalho focado (1 dia).

---

**Pronto para começar?** 💪

Comece criando o arquivo `materialize_helpers.py` com a função `load_deputy_data_by_year()` que está no plano completo!