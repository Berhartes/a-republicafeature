# 🎓 Explicação Simples: Paralelização e ETL Incremental

> **Para desenvolvedores que estão começando a entender o projeto**

---

## 🚀 Plano 1: Paralelização com Rate Limiting Global

### O Problema Atual

Imagine que você precisa buscar dados de 513 deputados na API da Câmara. Hoje, o ETL funciona assim:

```
Deputado 1 → Espera 150ms → Deputado 2 → Espera 150ms → Deputado 3 → ...
```

É como se você tivesse **uma pessoa** fazendo **uma tarefa de cada vez**. Demora muito!

### A Solução: Trabalho em Equipe (Paralelização)

A ideia é ter **várias pessoas trabalhando ao mesmo tempo**, mas com uma regra importante:

```
Worker 1: Deputado 1 → Deputado 4 → Deputado 7 → ...
Worker 2: Deputado 2 → Deputado 5 → Deputado 8 → ...
Worker 3: Deputado 3 → Deputado 6 → Deputado 9 → ...
```

Agora temos **3 pessoas** trabalhando em paralelo! Muito mais rápido!

### ⚠️ O Grande Problema: Regras da API

A API da Câmara tem regras rígidas:

1. **Limite de itens por requisição:** Máximo 100 itens
2. **Paginação obrigatória:** Se tem mais de 100 itens, precisa buscar em várias páginas
3. **Rate Limiting (não oficial):** Se você fizer requisições muito rápido, a API pode te bloquear

**Analogia:** É como um restaurante que só atende 100 pessoas por vez. Se você tentar entrar com 200 pessoas de uma vez, o segurança não deixa!

### 🎯 A Solução Inteligente: Rate Limiter Global

Imagine que os 3 workers são 3 pessoas querendo usar o mesmo telefone para ligar para a API:

**SEM Rate Limiter Global (RUIM):**
```
Worker 1: Liga agora!
Worker 2: Liga agora!  ← Todos ligam ao mesmo tempo
Worker 3: Liga agora!  ← API fica sobrecarregada e bloqueia!
```

**COM Rate Limiter Global (BOM):**
```
Worker 1: "Posso ligar?" → Rate Limiter: "Sim!" → Liga
Worker 2: "Posso ligar?" → Rate Limiter: "Espera 150ms..." → Liga
Worker 3: "Posso ligar?" → Rate Limiter: "Espera 150ms..." → Liga
```

O **Rate Limiter Global** é como um **porteiro** que controla quem pode fazer requisição e quando!

### Como Funciona na Prática

```python
# Cada worker antes de fazer uma requisição pergunta:
rate_limiter.wait_if_needed()  # "Posso fazer requisição agora?"

# O rate limiter responde:
# - "Sim, pode!" (se já passou 150ms desde a última)
# - "Espera X milissegundos..." (se ainda não passou tempo suficiente)
```

### Por Que Isso Funciona?

1. **Múltiplos workers** processam deputados diferentes ao mesmo tempo
2. **Rate limiter global** garante que TODAS as requisições respeitam o intervalo mínimo
3. **Resultado:** Mais rápido, mas sem quebrar as regras da API!

### Configurações Recomendadas

```python
# CONSERVADOR (mais seguro, para começar)
num_workers = 2
wait_ms = 200  # 200ms entre requisições

# BALANCEADO (recomendado para produção)
num_workers = 3
wait_ms = 150  # 150ms entre requisições

# AGRESSIVO (apenas se monitorar bem)
num_workers = 4
wait_ms = 120  # 120ms entre requisições
```

**Dica:** Comece com configuração conservadora e vá aumentando aos poucos, monitorando se a API não bloqueia!

---

## 📅 Plano 2: ETL Incremental

### O Problema Atual

Toda vez que você roda o ETL, ele processa **TUDO de novo**:

```
Segunda-feira: Processa 513 deputados (30 minutos)
Terça-feira:   Processa 513 deputados (30 minutos) ← Reprocessa tudo!
Quarta-feira:  Processa 513 deputados (30 minutos) ← Reprocessa tudo!
```

É como **limpar a casa inteira todos os dias**, mesmo que só a cozinha esteja suja!

### A Solução: Processar Apenas o Novo

ETL Incremental significa: **"Só processa o que mudou desde a última vez"**

```
Segunda-feira: Processa 513 deputados (30 minutos) ← Primeira vez, processa tudo
Terça-feira:   Processa 5 deputados novos (2 minutos) ← Só os novos!
Quarta-feira:  Processa 3 deputados novos (1 minuto) ← Só os novos!
```

### Como Funciona?

O ETL guarda um **"caderninho de anotações"** (arquivo JSON) com:

1. **Quando foi a última execução:** "Última vez: 2025-01-20 10:00"
2. **Quais deputados já foram processados:** "Deputado 123: processado em 2025-01-20"

### Exemplo Prático

**Arquivo de Estado (state.json):**
```json
{
  "last_run": "2025-01-20T10:00:00",
  "processed_deputies": {
    "123": "2025-01-20T10:05:00",
    "456": "2025-01-20T10:10:00",
    "789": "2025-01-20T10:15:00"
  }
}
```

**Na próxima execução:**
```python
# 1. Carrega o estado
tracker = IncrementalTracker("state.json")
last_run = tracker.get_last_run()  # "2025-01-20 10:00"

# 2. Busca apenas deputados novos ou modificados
novos_deputados = buscar_deputados_desde(last_run)  # Só 5 deputados!

# 3. Processa apenas os novos
for deputado in novos_deputados:
    processar(deputado)
    tracker.mark_deputy_processed(deputado.id, datetime.now())

# 4. Salva o novo estado
tracker.save()  # Atualiza "last_run" para agora
```

### Benefícios

1. **90% mais rápido** em atualizações diárias
2. **Menos carga na API** (menos requisições)
3. **Pode rodar mais vezes** (porque é rápido)

### Quando Usar Cada Modo?

**Modo Completo (atual):**
- ✅ Primeira execução
- ✅ Quando quer reprocessar tudo
- ✅ Quando suspeita que tem dados corrompidos

**Modo Incremental (novo):**
- ✅ Atualizações diárias
- ✅ Quando quer dados frescos rapidamente
- ✅ Em produção, rodando todo dia

---

## 🤔 Comparação: Antes vs Depois

### Cenário: Atualização Diária de Dados

**ANTES (sem otimizações):**
```
Tempo: 30 minutos
Deputados processados: 513 (todos)
Requisições à API: ~2.000
```

**DEPOIS (com Paralelização):**
```
Tempo: 10 minutos (3x mais rápido)
Deputados processados: 513 (todos)
Requisições à API: ~2.000
```

**DEPOIS (com Paralelização + Incremental):**
```
Tempo: 1 minuto (30x mais rápido!)
Deputados processados: 5 (só os novos)
Requisições à API: ~20
```

---

## 🎯 Resumo para Dev Junior

### Paralelização com Rate Limiting

**O que é?**
- Processar vários deputados ao mesmo tempo (em paralelo)

**Por que precisa de Rate Limiter Global?**
- Para não fazer requisições demais e ser bloqueado pela API

**Como funciona?**
- Vários workers processam deputados diferentes
- Um "porteiro" (rate limiter) controla quando cada um pode fazer requisição
- Todos respeitam o intervalo mínimo de 150ms

**Resultado:**
- 2-3x mais rápido
- Sem quebrar regras da API

### ETL Incremental

**O que é?**
- Processar apenas dados novos, não tudo de novo

**Como funciona?**
- Guarda quando foi a última execução
- Na próxima vez, busca apenas o que mudou desde então
- Processa só os novos

**Resultado:**
- 90% mais rápido em atualizações
- Menos carga na API

---

## ❓ Perguntas Frequentes

### 1. "E se a API bloquear mesmo com Rate Limiter?"

**R:** Comece com configuração conservadora (2 workers, 200ms). Se funcionar bem por alguns dias, aumente gradualmente.

### 2. "O que acontece se o ETL Incremental falhar no meio?"

**R:** O estado é salvo apenas no final. Se falhar, na próxima execução ele reprocessa os mesmos dados (seguro).

### 3. "Posso usar os dois juntos?"

**R:** SIM! E é o recomendado:
- **Paralelização:** Torna cada execução mais rápida
- **Incremental:** Faz você executar menos vezes com menos dados

### 4. "Como sei se está funcionando?"

**R:** Monitore:
- Tempo de execução (deve diminuir)
- Erros da API (não deve ter bloqueios)
- Logs do rate limiter (deve mostrar esperas)

---

## 🚦 Próximos Passos

1. **Implementar Rate Limiter Global** (mais simples, 8 horas)
2. **Testar com 2 workers** (conservador)
3. **Monitorar por 1 semana**
4. **Aumentar para 3 workers** se estável
5. **Implementar ETL Incremental** (16 horas)
6. **Combinar os dois** para máxima eficiência

---

**Dúvidas?** Releia este documento ou pergunte! 😊