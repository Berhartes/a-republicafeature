# 🚨 Runbook: Pipeline de Dados - A República

**Última atualização:** 7 de novembro de 2025  
**Versão:** 1.0  
**Responsável:** Time de Engenharia

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Troubleshooting Rápido](#troubleshooting-rápido)
3. [Problemas Comuns](#problemas-comuns)
   - [Contracts Gate Falhou](#1-contracts-gate-falhou)
   - [Datalake Verify Falhou](#2-datalake-verify-falhou)
   - [Cache Publish Falhou](#3-cache-publish-falhou)
   - [Frontend Build Falhou](#4-frontend-build-falhou)
   - [Server Actions com Erros](#5-server-actions-com-erros)
4. [Checklist de Recovery](#checklist-de-recovery)
5. [Contatos e Escalação](#contatos-e-escalação)

---

## Visão Geral

O pipeline de dados da A República é composto por 5 etapas principais:

```
┌──────────────┐     ┌──────────┐     ┌────────────┐     ┌──────────────┐     ┌──────────┐
│ Contracts    │────▶│   ETL    │────▶│  Datalake  │────▶│ Materialize  │────▶│  Cache   │
│ Validation   │     │  Python  │     │  Verify    │     │   Helpers    │     │ Publish  │
└──────────────┘     └──────────┘     └────────────┘     └──────────────┘     └──────────┘
       │                   │                  │                   │                  │
       ▼                   ▼                  ▼                   ▼                  ▼
  CI Daily           Manual Run        Auto-check        Auto-manifest       Frontend Load
```

**SLAs:**
- Contracts Gate: 24h (não bloqueia se API estável)
- ETL → Cache: 4h (bloqueia deploy)
- Frontend Deploy: 1h

---

## Troubleshooting Rápido

### Checklist de Diagnóstico (2 minutos)

```bash
# 1. Verificar último evento de cada etapa
pnpm tsx scripts/collect-events.ts

# 2. Rodar release checklist completo
pnpm tsx scripts/release-checklist.ts

# 3. Ver logs recentes
git log --oneline -10

# 4. Verificar branch
git status
```

### Comandos Úteis

```bash
# Ver manifests
cat bancoDados/monitordespesas/_etl-run-manifest.json
cat bancoDados/monitordespesas/_datalake-manifest.json
cat packages/monitor-despesas-next/public/cache/caches-manifest.json

# Re-executar etapa específica
pnpm --filter @a-republica/etl-python run etl:camara -- --anos 2024
pnpm --filter @a-republica/etl-python run datalake:verify
pnpm --filter @a-republica/monitor-despesas-next cache:manifests:refresh
pnpm --filter @a-republica/monitor-despesas-next cache:publish:dry-run
```

---

## Problemas Comuns

### 1. Contracts Gate Falhou

**Sintoma:**
```
❌ Workflow "Contracts Gate" falha no CI
Erro: Schema validation failed for /deputados endpoint
```

**Causas Prováveis:**
1. API Dados Abertos mudou schema sem aviso
2. Campo novo adicionado/removido
3. Tipo de dado alterado (ex: string → number)

**Resolução:**

#### Passo 1: Identificar endpoint que falhou
```bash
cd packages/etlpython
cat .github/workflows/contracts-gate.yml
# Ou ver logs do workflow no GitHub Actions
```

#### Passo 2: Atualizar schema
```bash
# Editar schema correspondente
vim contracts/schemas/deputados.json

# Exemplo de mudança:
# Antes: { "nome": { "type": "string" } }
# Depois: { "nome": { "type": "string" }, "nomeEleitoral": { "type": "string" } }
```

#### Passo 3: Validar localmente
```bash
pnpm contracts:validate --live
# Deve retornar ✅ para todos os endpoints
```

#### Passo 4: Commitar e rerun workflow
```bash
git add contracts/schemas/
git commit -m "fix: atualizar schema de deputados para incluir nomeEleitoral"
git push

# Re-executar workflow no GitHub Actions UI
```

**SLA:** 24h (não bloqueia deploy se API está estável)

**Prevenção:**
- Monitorar changelog da API Dados Abertos
- Adicionar testes de schema em CI
- Configurar alertas para mudanças de schema

---

### 2. Datalake Verify Falhou

**Sintoma:**
```
❌ pnpm run datalake:verify retorna erros de hash
Hash mismatch: deputados/56/2024.json
  Expected: abc123...
  Got:      def456...
```

**Causas Prováveis:**
1. Arquivo corrompido durante ETL
2. Edição manual acidental de arquivo
3. Git merge conflict mal resolvido
4. Disco cheio durante escrita

**Resolução:**

#### Passo 1: Identificar arquivos afetados
```bash
cd packages/etlpython
pnpm run datalake:verify > verify-errors.txt
cat verify-errors.txt | grep "Hash mismatch"
```

#### Passo 2: Re-executar ETL apenas para anos afetados
```bash
# Se erro em deputados/56/2024.json:
pnpm run etl:camara -- --anos 2024

# Ou para deputado específico:
pnpm run etl:camara -- --deputados 56 --anos 2024
```

#### Passo 3: Reparticionar datalake
```bash
pnpm run datalake:partition
# Reorganiza arquivos por legislatura/ano
```

#### Passo 4: Verificar novamente
```bash
pnpm run datalake:verify
# Deve retornar ✅ sem hash mismatches
```

**Caso persista:**
```bash
# Backup do arquivo corrompido
cp bancoDados/monitordespesas/deputados/56/2024.json \
   bancoDados/monitordespesas/deputados/56/2024.json.bak

# Deletar e re-executar ETL completo
rm bancoDados/monitordespesas/deputados/56/2024.json
pnpm run etl:camara -- --deputados 56 --anos 2024

# Verificar
pnpm run datalake:verify
```

**SLA:** 2h (bloqueia materialização)

**Prevenção:**
- Evitar edição manual de arquivos no datalake
- Usar `.gitattributes` para prevenir merge conflicts em JSON
- Monitorar espaço em disco

---

### 3. Cache Publish Falhou

**Sintoma:**
```
❌ cache:publish:dry-run exibe entradas inválidas
Invalid entry: suppliers-cache.json (missing hash)
```

**Causas Prováveis:**
1. Materialização gerou caches sem hash
2. Manifest desatualizado
3. Arquivo de cache corrompido
4. Hash não calculado corretamente

**Resolução:**

#### Passo 1: Recalcular hashes
```bash
cd packages/monitor-despesas-next
pnpm cache:manifests:refresh
# Recalcula hashes de todos os caches
```

#### Passo 2: Verificar manifests
```bash
cat public/cache/caches-manifest.json
cat public/cache/transactions/transactions-manifest.json

# Cada entrada deve ter:
# - name
# - size
# - hash
# - lastModified
```

#### Passo 3: Se persiste, re-materializar
```bash
cd ../etlpython
pnpm run etl:materialize:all
# Regenera todos os caches de scratch
```

#### Passo 4: Refresh manifests novamente
```bash
cd ../monitor-despesas-next
pnpm cache:manifests:refresh
```

#### Passo 5: Dry-run para validar
```bash
pnpm cache:publish:dry-run
# Deve mostrar todas as entradas válidas
```

**SLA:** 1h (bloqueia deploy frontend)

**Prevenção:**
- Rodar `cache:manifests:refresh` após cada materialização
- Adicionar validação de hash em CI
- Implementar testes de integridade de manifests

---

### 4. Frontend Build Falhou

**Sintoma:**
```
❌ pnpm build falha com erro de TypeScript
Error: Type 'undefined' is not assignable to type 'Fornecedor[]'
  src/app/gastos/fornecedores/page.tsx:45
```

**Causas Prováveis:**
1. Schema Zod não sincronizado com tipos TypeScript
2. Server Action retornando estrutura diferente
3. Cache com dados inválidos
4. Dependência desatualizada

**Resolução:**

#### Passo 1: Type-check isolado
```bash
cd packages/monitor-despesas-next
pnpm type-check
# Identifica todos os erros de tipo
```

#### Passo 2: Verificar schema vs. tipo
```bash
# Comparar:
vim src/app/gastos/services/analytics.ts  # Schema Zod
vim src/types/fornecedores.ts             # Tipo TypeScript

# Garantir que z.infer<typeof schema> está correto
```

#### Passo 3: Re-gerar tipos (se usando codegen)
```bash
pnpm generate:types
# Ou manualmente atualizar tipos para match com schema
```

#### Passo 4: Testar Server Action localmente
```bash
pnpm dev
# Abrir http://localhost:3000/gastos/fornecedores
# Verificar console para erros de validação Zod
```

**SLA:** 1h

**Prevenção:**
- Usar `z.infer` para derivar tipos de schemas
- Adicionar testes unitários de schemas
- CI deve rodar `type-check` antes de merge

---

### 5. Server Actions com Erros

**Sintoma:**
```
❌ Frontend exibe: "Erro ao carregar dados"
Console: ZodError: Invalid type: expected number, received string at "totalRecebido"
```

**Causas Prováveis:**
1. Cache gerado com schema antigo
2. Validação Zod muito restritiva
3. Dados da API mudaram formato
4. Bug na materialização

**Resolução:**

#### Passo 1: Identificar Server Action que falhou
```bash
# Ver logs do browser console
# Exemplo: "[getFornecedores] Validação Zod falhou"
```

#### Passo 2: Inspecionar dados brutos
```bash
# Abrir cache no editor
code packages/monitor-despesas-next/public/cache/suppliers-cache.json

# Verificar campo que falhou
# Ex: "totalRecebido": "10000.50"  <- string em vez de number
```

#### Passo 3: Corrigir materialização
```bash
cd packages/etlpython

# Editar helper que gera o cache
vim src/etl/materialize/helpers/suppliers.py

# Garantir conversão de tipo:
# Antes: total_recebido = row['total']
# Depois: total_recebido = float(row['total'])
```

#### Passo 4: Re-materializar
```bash
pnpm run etl:materialize:suppliers
pnpm run cache:manifests:refresh
```

#### Passo 5: Testar
```bash
cd ../monitor-despesas-next
pnpm dev
# Abrir página e verificar que dados carregam
```

**Alternativa - Relaxar Schema Temporariamente:**
```typescript
// src/app/gastos/services/analytics.ts
const fornecedorRecordSchema = z.object({
  // Antes:
  // totalRecebido: z.number().nonnegative(),
  
  // Depois (aceita string e converte):
  totalRecebido: z.coerce.number().nonnegative(),
})
```

**SLA:** 2h

**Prevenção:**
- Testes de integração ETL → Schema
- Validação de schema em materializadores
- Snapshot tests de caches

---

## Checklist de Recovery

Use este checklist quando múltiplas etapas falharem:

### Recovery Completo (do zero)

```bash
# 1. Limpar caches antigos
cd packages/monitor-despesas-next
rm -rf public/cache/*

# 2. Re-executar ETL completo
cd ../etlpython
pnpm run etl:camara -- --anos 2019,2020,2021,2022,2023,2024

# 3. Verificar datalake
pnpm run datalake:verify

# 4. Particionar (se necessário)
pnpm run datalake:partition

# 5. Materializar tudo
pnpm run etl:materialize:all

# 6. Refresh manifests
cd ../monitor-despesas-next
pnpm cache:manifests:refresh

# 7. Dry-run publish
pnpm cache:publish:dry-run

# 8. Type-check
pnpm type-check

# 9. Build frontend
pnpm build

# 10. Testes E2E
pnpm test:e2e
```

**Tempo estimado:** 2-4 horas (dependendo de quantos anos re-processar)

---

## Contatos e Escalação

### Níveis de Suporte

**Nível 1 - Self-Service (0-2h)**
- Consultar este runbook
- Rodar comandos de diagnóstico
- Re-executar etapas falhadas

**Nível 2 - Time de Engenharia (2-8h)**
- Problemas persistentes após recovery
- Erros de schema complexos
- Issues de performance

**Nível 3 - Escalação (8-24h)**
- API Dados Abertos offline
- Corrupção de dados em produção
- Bugs críticos no ETL

### Canais de Comunicação

- **Slack:** `#a-republica-alerts`
- **GitHub Issues:** Tag `bug` + `priority:high`
- **Email:** engenharia@arepublica.dev

---

## Logs e Observabilidade

### Coletar Eventos
```bash
pnpm tsx scripts/collect-events.ts --output json
cat observability-events.json
```

### Enviar Alerta Manual
```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
pnpm tsx scripts/alert.ts --event-type etl_run --status failure
```

### Visualizar Dashboard
- **Grafana:** https://grafana.arepublica.dev (TODO)
- **Google Sheets:** [Link] (TODO)

---

## Referências

- [FLUXO-DADOS-ROADMAP.md](../01-architecture/FLUXO-DADOS-ROADMAP.md)
- [GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md)
- [ETAPA2_FRONTEND_CONCLUIDA.md](../08-status/ETAPA2_FRONTEND_CONCLUIDA.md)
- [API Dados Abertos - Documentação](https://dadosabertos.camara.leg.br/swagger/api.html)

---

**Última revisão:** 7 de novembro de 2025  
**Próxima revisão:** Após deploy de Etapa 3 (Observabilidade)
