# Plano de Refatoração: Centralização de Processamento no Sistema ETL

## Objetivo

Centralizar todo o processamento de dados no **Sistema ETL**, eliminando processamento duplicado nos módulos `monitordespesas` e `a-republica-brasileira2`. Os módulos devem consumir apenas caches gerados pelo Sistema ETL.

## Situação Atual (Problemática)

### Processamento Distribuído Incorreto:
- **Sistema ETL**: Processamento principal + geração de caches
- **monitordespesas**: Processamento próprio + consumo de caches
- **a-republica-brasileira2**: Processamento próprio independente

### Problemas Identificados:
1. **Duplicação de lógica** entre módulos
2. **Inconsistência de dados** devido a processamentos diferentes
3. **Desperdício de recursos** com processamentos redundantes
4. **Dificuldade de manutenção** com lógica espalhada

## Arquitetura Alvo

```
┌─────────────────┐    gera caches    ┌──────────────────────┐
│   Sistema ETL   │ ──────────────────>│ a-republica-        │
│                 │                   │ brasileira-caches    │
│ • Únicos        │                   │                      │
│   processadores │                   │ • suppliers-cache    │
│ • Gera todos    │                   │ • dashboard-cache    │
│   os caches     │                   │ • analysis-cache     │
└─────────────────┘                   │ • deputies-cache     │
                                      │ • rankings-cache     │
                                      │ • premiacoes-cache   │
                                      │ • transacoes-cache   │
                                      │ • categorias-cache   │
                                      └──────────────────────┘
                                               │
                                               │ consome apenas
                                               ▼
                    ┌──────────────────┐             ┌─────────────────────┐
                    │ monitordespesas  │             │ a-republica-        │
                    │                  │             │ brasileira2         │
                    │ • Apenas UI      │             │                     │
                    │ • Consome caches │             │ • Apenas UI         │
                    │ • Sem processam. │             │ • Consome caches    │
                    └──────────────────┘             │ • Sem processam.    │
                                                     └─────────────────────┘
```

## Fase 1: Centralização no Sistema ETL

### 1.1 Mover Processadores do monitordespesas

**Arquivos a mover:**
```
monitordespesas/src/services/premiacoes-processor.ts
  → Sistema ETL/src/processors/premiacoes.processor.ts

monitordespesas/src/services/fornecedores-service.ts
  → Sistema ETL/src/processors/fornecedores.processor.ts

monitordespesas/src/services/rankings-otimizados-service.ts
  → Sistema ETL/src/processors/rankings.processor.ts

monitordespesas/src/services/banco-dados-local-browser.ts
  → Sistema ETL/src/processors/local-database.processor.ts
```

**Hooks a migrar:**
```
monitordespesas/src/hooks/useGlobalFornecedoresProcessor.ts
monitordespesas/src/hooks/useGlobalTransacoesProcessor.ts
monitordespesas/src/hooks/useProcessadorPremiacoes.ts
monitordespesas/src/hooks/useTransacoesWorker.ts
```

**Workers a migrar:**
```
monitordespesas/src/workers/transacoes.worker.ts
  → Sistema ETL/src/workers/transacoes.worker.ts
```

### 1.2 Mover Processadores do a-republica-brasileira2

**Scripts ETL a consolidar:**
```
a-republica-brasileira2/src/core/functions/camara_api_wrapper/
  → Sistema ETL/src/core/camara_api_wrapper/ (consolidar com existente)

a-republica-brasileira2/src/core/functions/senado_api_wrapper/
  → Sistema ETL/src/core/senado_api_wrapper/ (novo)
```

**Processadores específicos:**
```
a-republica-brasileira2/src/core/functions/.../processors/despesas-deputados-v3.processor.ts
  → Sistema ETL/src/processors/despesas-deputados-v3.processor.ts

a-republica-brasileira2/src/core/functions/.../processors/perfil-deputados.processor.ts
  → Sistema ETL/src/processors/perfil-deputados.processor.ts
```

### 1.3 Services a Remover (manter apenas clients)

**No a-republica-brasileira2:**
```
src/domains/republica/congresso/camara/services/camara-api.service.ts
  → Manter apenas como client de cache, remover processamento
```

## Fase 2: Expandir Caches Gerados

### 2.1 Novos Caches a Implementar

**Adicionar ao Sistema ETL:**
```javascript
// package.json scripts
"etl:premiacoes": "node dist/cli/etl-runner.js premiacoes",
"etl:transacoes": "node dist/cli/etl-runner.js transacoes",
"etl:categorias": "node dist/cli/etl-runner.js categorias",
"etl:rankings": "node dist/cli/etl-runner.js rankings",
"etl:all": "npm run etl:despesas && npm run etl:premiacoes && npm run etl:transacoes && npm run etl:categorias && npm run etl:rankings"
```

**Estrutura de caches expandida:**
```
a-republica-brasileira-caches/latest/
├── suppliers-cache.json        (existente)
├── dashboard-cache.json        (existente)
├── analysis-cache.json         (existente)
├── deputies-cache.json         (existente)
├── rankings-cache.json         (existente)
├── premiacoes-cache.json       (novo)
├── transacoes-cache.json       (novo)
├── categorias-cache.json       (novo)
├── senado-cache.json           (novo)
└── caches-manifest.json        (atualizar)
```

### 2.2 Melhorar Estrutura de Caches

**Versionamento:**
```
a-republica-brasileira-caches/
├── latest/                     (symlink para versão atual)
├── versioned/
│   ├── 2025-10-06/
│   ├── 2025-10-07/
│   └── ...
└── metadata/
    ├── generation-logs/
    └── cache-stats/
```

**Manifest expandido:**
```json
{
  "generatedAt": "2025-10-06T18:10:41.028Z",
  "legislatura": 57,
  "version": "3.0.0",
  "etlVersion": "2.1.0",
  "processingTime": "00:45:32",
  "entries": [
    {
      "filename": "suppliers-cache.json",
      "hash": "...",
      "size": 18044892,
      "processor": "fornecedores.processor",
      "generatedAt": "2025-10-06T17:30:15.123Z",
      "dependencies": ["deputies-cache.json"]
    }
  ],
  "dependencies": {
    "schema": "@a-republica/monitordespesas-schema@2.1.0",
    "apis": {
      "camara": "https://dadosabertos.camara.leg.br/api/v2",
      "senado": "https://legis.senado.leg.br/dadosabertos"
    }
  }
}
```

## Fase 3: Refatorar Módulos Consumidores

### 3.1 Monitor Despesas - Remoções

**Páginas de processamento a remover:**
```
monitordespesas/src/pages/ProcessadorFornecedores.tsx     → REMOVER
monitordespesas/src/pages/ProcessadorTransacoes.tsx      → REMOVER
monitordespesas/src/pages/ProcessadorPremiacoes.tsx      → REMOVER
monitordespesas/src/pages/ProcessadorDeputados.tsx       → REMOVER
monitordespesas/src/pages/UploadPage.tsx                 → REMOVER
```

**Services de processamento a remover:**
```
monitordespesas/src/services/premiacoes-processor.ts     → MOVER
monitordespesas/src/services/fornecedores-service.ts     → MOVER
monitordespesas/src/services/rankings-otimizados-service.ts → MOVER
monitordespesas/src/services/banco-dados-local-browser.ts → MOVER
monitordespesas/src/services/sistema-etl-bridge.ts       → REMOVER
```

**Hooks de processamento a remover:**
```
monitordespesas/src/hooks/useGlobalFornecedoresProcessor.ts → MOVER
monitordespesas/src/hooks/useGlobalTransacoesProcessor.ts   → MOVER
monitordespesas/src/hooks/useProcessadorPremiacoes.ts       → MOVER
monitordespesas/src/hooks/useTransacoesWorker.ts            → MOVER
```

**Utils de processamento a remover:**
```
monitordespesas/src/components/fornecedor/utils/dataProcessing.ts      → MOVER
monitordespesas/src/components/deputado/utils/deputadoDataProcessing.ts → MOVER
monitordespesas/src/components/categoria-fornecedores/utils/categoriaDataProcessing.ts → MOVER
```

### 3.2 Monitor Despesas - Manter/Adaptar

**Clients de cache (manter e melhorar):**
```
monitordespesas/src/data-access/monitordespesas.ts       → MANTER
monitordespesas/src/utils/cdn-fetcher.ts                 → MANTER
monitordespesas/src/services/etl-cache.service.ts        → ADAPTAR
monitordespesas/src/components/cache/CacheSelector.tsx   → MANTER
```

**Hooks de dados (adaptar para novos caches):**
```
monitordespesas/src/hooks/useLazyData.ts                 → ADAPTAR
monitordespesas/src/data-access/lazy-loader.ts           → ADAPTAR
```

### 3.3 a-republica-brasileira2 - Remoções

**Processadores ETL a remover:**
```
src/core/functions/camara_api_wrapper/                   → MOVER PARA SISTEMA ETL
src/core/functions/senado_api_wrapper/                   → MOVER PARA SISTEMA ETL
```

**Services de processamento a remover:**
```
src/domains/republica/congresso/camara/services/camara-api.service.ts → ADAPTAR (manter apenas client)
```

**Hooks de processamento a adaptar:**
```
src/domains/republica/congresso/senado/hooks/useProposicoesSenador.ts → ADAPTAR
src/domains/republica/congresso/senado/hooks/useMaterias.ts           → ADAPTAR
src/domains/republica/congresso/senado/hooks/useDespesasSenador.ts    → ADAPTAR
src/domains/republica/congresso/senado/hooks/useComissoesSenador.ts   → ADAPTAR
```

## Fase 4: Unificação de Schemas

### 4.1 Schema Centralizado

**Expandir `shared/monitordespesas-schema`:**
```typescript
// shared/monitordespesas-schema/src/types/
├── camara/
│   ├── deputados.types.ts
│   ├── despesas.types.ts
│   └── fornecedores.types.ts
├── senado/
│   ├── senadores.types.ts
│   ├── materias.types.ts
│   └── votacoes.types.ts
├── cache/
│   ├── manifest.types.ts
│   ├── suppliers.types.ts
│   ├── deputies.types.ts
│   ├── rankings.types.ts
│   ├── premiacoes.types.ts
│   └── analysis.types.ts
└── common/
    ├── base.types.ts
    └── api.types.ts
```

### 4.2 Versionamento de Schemas

**package.json:**
```json
{
  "name": "@a-republica/monitordespesas-schema",
  "version": "3.0.0",
  "exports": {
    "./camara": "./dist/types/camara/index.js",
    "./senado": "./dist/types/senado/index.js",
    "./cache": "./dist/types/cache/index.js",
    "./common": "./dist/types/common/index.js"
  }
}
```

## Cronograma de Implementação

### Semana 1: Preparação
- [ ] Backup completo do projeto
- [x] Criar branch `refactor/centralizacao-etl`
- [x] Expandir schemas no `shared/monitordespesas-schema`
- [ ] Testar Sistema ETL atual

### Semana 2: Fase 1 - Migração para Sistema ETL
- [ ] Mover processadores do monitordespesas
- [ ] Mover processadores do a-republica-brasileira2
- [ ] Adaptar Sistema ETL para novos processadores
- [ ] Testar geração de caches expandidos

### Semana 3: Fase 2 - Novos Caches
- [ ] Implementar novos processadores (premiações, transações, categorias)
- [ ] Expandir manifest e estrutura de caches
- [ ] Implementar versionamento de caches
- [ ] Testar geração completa de caches

### Semana 4: Fase 3 - Refatoração dos Módulos
- [ ] Remover processamento do monitordespesas
- [ ] Remover processamento do a-republica-brasileira2
- [ ] Adaptar clients para novos caches
- [ ] Testar funcionalidades mantendo compatibilidade

### Semana 5: Fase 4 - Finalização
- [ ] Unificar schemas finais
- [ ] Documentar nova arquitetura
- [ ] Testar sistema completo
- [ ] Deploy e validação

## Comandos de Migração

### 1. Preparação
```bash
# Backup
git checkout -b refactor/centralizacao-etl
git add .
git commit -m "Backup antes da refatoração de centralização ETL"

# Expandir schema
cd shared/monitordespesas-schema
npm version minor
npm run build
```

### 2. Migração de Arquivos
```bash
# Mover processadores do monitordespesas
mkdir -p "Sistema ETL/src/processors/migrated"
cp monitordespesas/src/services/premiacoes-processor.ts "Sistema ETL/src/processors/migrated/"
cp monitordespesas/src/services/fornecedores-service.ts "Sistema ETL/src/processors/migrated/"
# ... outros arquivos

# Mover processadores do a-republica-brasileira2
cp -r a-republica-brasileira2/src/core/functions/camara_api_wrapper "Sistema ETL/src/core/"
cp -r a-republica-brasileira2/src/core/functions/senado_api_wrapper "Sistema ETL/src/core/"
```

### 3. Configuração do Sistema ETL
```bash
cd "Sistema ETL"

# Adicionar novos scripts
npm run build
npm run etl:premiacoes
npm run etl:transacoes
npm run etl:categorias
npm run etl:all
```

### 4. Limpeza dos Módulos
```bash
# Remover arquivos do monitordespesas
rm monitordespesas/src/pages/Processador*.tsx
rm monitordespesas/src/services/premiacoes-processor.ts
rm monitordespesas/src/services/fornecedores-service.ts
# ... outros arquivos

# Remover processadores do a-republica-brasileira2
rm -rf a-republica-brasileira2/src/core/functions/
```

### 5. Validação
```bash
# Testar Sistema ETL
cd "Sistema ETL"
npm run etl:all
npm run test

# Testar monitordespesas
cd monitordespesas
npm run build
npm run dev

# Testar a-republica-brasileira2
cd a-republica-brasileira2
npm run build
npm run dev
```

## Validação da Refatoração

### Critérios de Sucesso:
1. ✅ **Sistema ETL** gera todos os caches necessários
2. ✅ **monitordespesas** funciona consumindo apenas caches
3. ✅ **a-republica-brasileira2** funciona consumindo apenas caches
4. ✅ Nenhum processamento duplicado entre módulos
5. ✅ Performance mantida ou melhorada
6. ✅ Todas as funcionalidades preservadas

### Testes de Regressão:
- [ ] Dashboard de gastos funcionando
- [ ] Listagem de deputados funcionando
- [ ] Perfis de deputados funcionando
- [ ] Análise de fornecedores funcionando
- [ ] Rankings funcionando
- [ ] Premiações funcionando
- [ ] Busca e filtros funcionando

## Documentação

### Arquivos de Documentação a Atualizar:
- [ ] `README.md` (projeto principal)
- [ ] `Sistema ETL/README.md`
- [ ] `monitordespesas/README.md`
- [ ] `a-republica-brasileira2/README.md`
- [ ] `shared/monitordespesas-schema/README.md`

### Nova Documentação:
- [ ] `ARQUITETURA-CENTRALIZADA.md`
- [ ] `GUIA-DESENVOLVIMENTO.md`
- [ ] `TROUBLESHOOTING-CACHES.md`

## Benefícios Esperados

### Técnicos:
- ✅ **Eliminação de duplicação** de código e lógica
- ✅ **Consistência de dados** entre todos os módulos
- ✅ **Facilidade de manutenção** com processamento centralizado
- ✅ **Performance melhorada** com caches otimizados
- ✅ **Escalabilidade** para novos tipos de dados

### Operacionais:
- ✅ **Deploy simplificado** com processamento centralizado
- ✅ **Debugging facilitado** com logs centralizados
- ✅ **Monitoramento unificado** do processamento
- ✅ **Versionamento consistente** de dados

---

**Status**: � Em andamento - Semana 1 (estrutura de schemas concluída)
**Próximos passos**: Realizar backup inicial e validar o Sistema ETL atual antes de iniciar migrações