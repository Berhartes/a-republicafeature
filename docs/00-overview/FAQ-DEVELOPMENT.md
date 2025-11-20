# ❓ FAQ de Desenvolvimento - A República

> Respostas às perguntas frequentes sobre o desenvolvimento e operação do projeto

**Última atualização:** 08/11/2025  
**Versão:** 1.0.0

---

## 📋 Índice

1. [Frequência do ETL](#1-frequência-do-etl)
2. [Deployment](#2-deployment)
3. [Testes e Cobertura](#3-testes-e-cobertura)
4. [API Express](#4-api-express)
5. [Padrões de Desenvolvimento](#5-padrões-de-desenvolvimento)

---

## 1. Frequência do ETL

### ❓ Com que frequência você normalmente executa o ETL completo?

**Resposta:** Atualmente **não há um cronograma automático**. O ETL é executado **sob demanda** quando necessário.

**Cenários de Execução:**

1. **Primeira carga** (completa)
   - Quando: Setup inicial ou nova legislatura
   - Comando: `pnpm run etl:despesasdeputados:pc 57`
   - Tempo: ~2-4 horas para todos os deputados da legislatura
   - Frequência: 1 vez a cada 4 anos (nova legislatura)

2. **Atualização incremental** (recomendado)
   - Quando: Dados novos disponíveis (geralmente semanalmente)
   - Comando: `pnpm run etl:despesasdeputados:pc 57 --incremental`
   - Tempo: ~2-5 minutos (processa apenas ano atual)
   - Frequência: **Semanal recomendado**

3. **Atualização completa** (rebuild)
   - Quando: Correções no pipeline ou validação
   - Comando: `pnpm run etl:despesasdeputados:pc 57`
   - Tempo: ~2-4 horas
   - Frequência: Conforme necessário (mensal ou menos)

### 📅 Cronograma Recomendado

```bash
# SEMANAL (toda segunda-feira às 6h)
# Atualiza apenas ano atual (rápido)
cd packages/etlpython
pnpm run etl:despesasdeputados:pc 57 --ano-inicio 2025 --ano-fim 2025 --incremental

# Depois de extrair, materializar os caches
pnpm run etl:materialize:all

# MENSAL (primeira segunda do mês)
# Validação completa para detectar inconsistências
pnpm run contracts:validate --live
pnpm run etl:despesasdeputados:pc 57 30 --incremental  # Amostra de 30 deputados

# TRIMESTRAL (ou quando necessário)
# Rebuild completo
pnpm run etl:despesasdeputados:pc 57  # Todos os deputados
pnpm run etl:materialize:all
```

### 🔄 Incremental vs Full Refresh

**Modo Incremental** (--incremental):
- ✅ 97% mais rápido
- ✅ 75% menos requisições à API
- ✅ Processa apenas ano atual
- ✅ Carrega anos anteriores do cache local
- ⚠️ Requer primeira execução completa

**Full Refresh** (sem --incremental):
- ✅ Garante consistência total
- ✅ Detecta correções retroativas
- ✅ Valida integridade de todos os anos
- ⚠️ Lento (2-4 horas)
- ⚠️ Muitas requisições à API

### 📊 Dados da API Câmara

A API da Câmara **atualiza dados diariamente**, mas:
- **Ano atual**: Muda diariamente (novas despesas)
- **Anos anteriores**: Raramente mudam (apenas correções)
- **Recomendação**: Executar incremental **semanalmente** é suficiente

**Nota técnica:** Implementado em `docs/ETL_INCREMENTAL_POR_ANO.md` - o sistema detecta automaticamente quando o ano vira (ex: 2025 → 2026) e ajusta quais anos processar.

---

## 2. Deployment

### ❓ Existem comandos específicos de deployment ou variáveis de ambiente que devem ser documentadas?

**Resposta:** O projeto **não tem deployment automatizado** atualmente, mas possui **contracts gate** no CI.

### 🚀 Ambiente de Produção (Futuro)

**Variáveis de Ambiente Necessárias:**

```bash
# Frontend (Next.js)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.arepublica.com.br
REVALIDATE_INTERVAL=3600  # ISR cache (1 hora)

# Backend (Express API - opcional)
PORT=3333
USE_UNIFIED_BACKEND=true
DATABASE_PATH=/data/monitordespesas.db

# Monitoramento (futuro)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
```

### 📦 Build para Produção

```bash
# 1. Limpar builds anteriores
pnpm clean

# 2. Type-check
pnpm type-check

# 3. Lint
pnpm lint:fix

# 4. Build todos os pacotes
pnpm build

# 5. Verificar tamanho do bundle
cd packages/monitor-despesas-next
cross-env ANALYZE=true pnpm run build:web
```

### 🔐 Contracts Gate (CI/CD)

**Arquivo:** `.github/workflows/contracts-gate.yml`

**Triggers:**
- ✅ **Diariamente** às 9h UTC (`cron: '0 9 * * *'`)
- ✅ **Pull Requests** que modificam `packages/etlpython/`
- ✅ **Manual** via workflow_dispatch

**Função:**
- Valida contratos da API Câmara contra schemas Pydantic
- Detecta breaking changes antes de rodar ETL completo
- Garante compatibilidade com API pública

**Comandos locais:**

```bash
# Validar contratos localmente (recomendado antes de ETL longo)
pnpm run contracts:validate

# Exportar schemas atualizados
pnpm run contracts:export
```

### 🌐 Deploy Manual (Atual)

```bash
# 1. Executar ETL
cd packages/etlpython
pnpm run etl:despesasdeputados:pc 57 --incremental
pnpm run etl:materialize:all

# 2. Validar caches
cd packages/monitor-despesas-next
pnpm run cache:publish:dry-run

# 3. Build frontend
pnpm run build:web

# 4. Copiar artefatos para servidor
# - Datalake: bancoDados/monitordespesas/
# - Caches: packages/monitor-despesas-next/public/cache/
# - Build: packages/monitor-despesas-next/.next/

# 5. Restart servidor (exemplo com PM2)
pm2 restart a-republica
```

### 🔮 Automação Futura (Roadmap)

**CI/CD Completo:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  schedule:
    - cron: '0 6 * * 1'  # Segunda 6h UTC (semanal)
  workflow_dispatch:

jobs:
  etl-incremental:
    runs-on: ubuntu-latest
    steps:
      - name: Run ETL
        run: |
          cd packages/etlpython
          pnpm run etl:despesasdeputados:pc 57 --incremental
          pnpm run etl:materialize:all
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: caches
          path: packages/monitor-despesas-next/public/cache/
  
  deploy-frontend:
    needs: etl-incremental
    runs-on: ubuntu-latest
    steps:
      - name: Build
        run: pnpm run build:web
      
      - name: Deploy to Vercel/Netlify
        run: vercel deploy --prod
```

**Prioridade:** Médio prazo (3-6 meses)  
**Esforço estimado:** 8 horas

---

## 3. Testes e Cobertura

### ❓ Devemos adicionar mais detalhes sobre a estratégia de testes (20% → 80% coverage)?

**Resposta:** Sim! A cobertura atual é **~20%**, com meta de **80%+**.

### 📊 Status Atual

| Pacote | Cobertura Atual | Meta | Prioridade |
|--------|----------------|------|------------|
| etlpython | ~20% | 80% | 🔴 Alta |
| monitor-despesas-next | ~15% | 70% | 🟡 Média |
| api | ~10% | 60% | 🟢 Baixa |
| shared | 0% | 50% | 🟢 Baixa |

### 🧪 Estratégia de Testes - ETL Python

**Localização:** `packages/etlpython/tests/`

**Testes Implementados:**

```bash
tests/
├── test_sqlite_writer.py           # ✅ SQLite persistence
├── test_materialize_snapshots.py   # ✅ Cache snapshots
├── fixtures/
│   └── materialize/                # ✅ Dados de teste
└── snapshots/                      # ✅ Expected outputs
```

**Como executar:**

```bash
cd packages/etlpython

# Todos os testes
pnpm run test

# Com coverage
pnpm run test -- --cov=etlpython --cov-report=html

# Testes específicos
pnpm run test -- tests/test_materialize_snapshots.py -v

# Regenerar snapshots (após mudanças intencionais)
pnpm run test -- tests/test_materialize_snapshots.py --snapshot-update
```

**Fixtures reduzidas:**
- 2 fornecedores
- 2 deputados (anos 2023 e 2024)
- Permite testes rápidos (~2s) e determinísticos

### 📝 Roadmap de Testes

#### Fase 1: Crítico (4 semanas)

**Prioridade ALTA - 40% coverage**

```python
# 1. Processadores de dados (12h)
tests/test_processors.py
- test_normalize_supplier_cnpj()
- test_aggregate_by_year()
- test_calculate_rankings()
- test_handle_invalid_data()

# 2. Materialização (12h)
tests/test_materialize_unified.py
- test_generate_suppliers_cache()
- test_generate_deputies_cache()
- test_compression_gzip()
- test_manifest_generation()

tests/test_materialize_paginated.py
- test_paginate_transactions()
- test_separate_by_year()
- test_generate_indexes()

# 3. Validação Pydantic (8h)
tests/test_models.py
- test_deputado_api_validation()
- test_despesa_api_validation()
- test_invalid_data_rejection()
- test_field_constraints()

# 4. Contracts (8h)
tests/test_contracts.py
- test_export_schemas()
- test_validate_live_api()
- test_detect_breaking_changes()
```

#### Fase 2: Importante (4 semanas)

**Prioridade MÉDIA - 60% coverage**

```python
# 5. Cliente API (8h)
tests/test_api_client.py
- test_fetch_legislators()
- test_fetch_expenses()
- test_rate_limiting()
- test_retry_on_failure()
- test_connection_errors()

# 6. File Writers (8h)
tests/test_file_writer.py
- test_write_json()
- test_create_directories()
- test_handle_encoding()
- test_atomic_writes()

# 7. Incremental ETL (12h)
tests/test_incremental.py
- test_detect_years_to_process()
- test_load_from_cache()
- test_auto_finalize_past_years()
- test_year_transition()  # 2025 → 2026
```

#### Fase 3: Completo (4 semanas)

**Prioridade BAIXA - 80% coverage**

```python
# 8. Integration Tests (16h)
tests/integration/
- test_full_etl_pipeline()
- test_datalake_structure()
- test_cache_consistency()

# 9. Performance Tests (12h)
tests/performance/
- test_etl_benchmarks()
- test_materialization_speed()
- test_memory_usage()

# 10. Edge Cases (8h)
tests/test_edge_cases.py
- test_empty_datasets()
- test_special_characters()
- test_large_volumes()
- test_concurrent_access()
```

### 🎯 Ferramentas de Teste

```bash
# pytest.ini (configuração)
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --verbose
    --cov=etlpython
    --cov-report=term-missing
    --cov-report=html
    --strict-markers

# requirements-dev.txt
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-mock>=3.10.0
pytest-snapshot>=0.9.0
```

### 📈 Meta de Cobertura

**Cronograma:**

| Prazo | Cobertura | Status |
|-------|-----------|--------|
| Atual | 20% | ✅ |
| 1 mês | 40% | 🎯 Fase 1 |
| 2 meses | 60% | 🎯 Fase 2 |
| 3 meses | 80%+ | 🎯 Fase 3 |

**Comando para monitorar progresso:**

```bash
# Gerar relatório HTML
pnpm run test -- --cov=etlpython --cov-report=html

# Abrir no navegador
start htmlcov/index.html  # Windows
open htmlcov/index.html   # macOS
```

---

## 4. API Express

### ❓ A API Express é ativamente usada ou é mais uma feature experimental/futura?

**Resposta:** A API Express é **experimental/legado** e **não está ativamente em uso**.

### 🔍 Status Atual da API

**Localização:** `packages/api/`

**Estado:**
- ✅ Código implementado
- ✅ Endpoints definidos
- ⚠️ **Não utilizado pelo frontend**
- ⚠️ **Não deployado em produção**

**Por quê?** O frontend usa **Server Actions** do Next.js 16, que são mais eficientes:
- Dados servidos diretamente do cache materialize
- Sem overhead de API HTTP
- ISR (Incremental Static Regeneration) nativo
- Type-safe com TypeScript
- SEO otimizado

### 🏗️ Arquitetura da API

```typescript
// packages/api/src/server.ts
const app = express()

app.get('/health', ...)
app.use('/gastos/fornecedores', createFornecedoresRouter())
app.use('/gastos/deputados', createDeputadosRouter())

// Porta: 3333 (configurável via .env)
```

**Endpoints disponíveis:**

```
GET /health
GET /gastos/fornecedores
GET /gastos/fornecedores/:cnpj
GET /gastos/deputados
GET /gastos/deputados/:id
```

**Dados servidos:**
- Lê do SQLite (`bancoDados/monitordespesas/monitordespesas.db`)
- Espelha estrutura do datalake
- Permite queries complexas

### 🤔 Por que Manter?

**Casos de uso futuros:**

1. **API Pública** (roadmap longo prazo)
   - Permitir acesso externo aos dados
   - Rate limiting e autenticação
   - Documentação com Swagger

2. **Integrações Externas**
   - Webhooks para alertas
   - Export de dados
   - Ferramentas de terceiros

3. **Mobile Apps**
   - React Native futuro
   - APIs REST convencionais
   - Menor bundle size

### 🔮 Decisão Recomendada

**Opção 1: Manter mas Marcar como Experimental**

```markdown
## API Express (Experimental)

⚠️ **Status:** Não utilizado atualmente pelo frontend

O projeto mantém uma API Express opcional que espelha os dados
do datalake em SQLite. Esta API NÃO é necessária para rodar
o frontend, que usa Server Actions do Next.js 16.

**Uso futuro:** API pública, integrações, mobile apps.

Para executar:
```bash
pnpm run dev:backend
# http://localhost:3333
```
```

**Opção 2: Remover Completamente**

- Economia: ~5 dependências
- Redução de complexidade
- Pode ser recriada no futuro se necessário

**Recomendação:** **Opção 1** - Manter como experimental. Custo de manutenção é baixo e pode ser útil no futuro.

### 📊 Comparação: API Express vs Server Actions

| Aspecto | API Express | Server Actions (Atual) |
|---------|-------------|----------------------|
| **Arquitetura** | REST API separada | Integrado no Next.js |
| **Performance** | HTTP overhead | Direto no servidor |
| **Type Safety** | Swagger/OpenAPI | TypeScript nativo |
| **SEO** | Não otimizado | HTML pré-renderizado |
| **Bundle Size** | +80KB cliente | 0KB (server-side) |
| **Cache** | Manual | ISR automático |
| **Uso Atual** | Não usado | ✅ Produção |

---

## 5. Padrões de Desenvolvimento

### ❓ Existem padrões recorrentes de desenvolvimento ou técnicas de debug específicas?

**Resposta:** Sim! Seguem os padrões principais do workflow.

### 🔧 Workflow de Desenvolvimento

#### 1. Setup Inicial

```bash
# 1. Clone e instale
git clone https://github.com/Berhartes/arepublica-brasileira
cd a-republica
pnpm install

# 2. Setup ETL Python
cd packages/etlpython
./migrate-venv.ps1  # Windows
./migrate-venv.sh   # Linux/Mac

# 3. Primeira carga de dados (amostra)
pnpm run etl:despesasdeputados:pc 57 10  # 10 deputados
pnpm run etl:materialize:all

# 4. Verificar caches
cd ../monitor-despesas-next
pnpm run cache:publish:dry-run

# 5. Rodar frontend
pnpm run dev
```

#### 2. Feature Development

```bash
# 1. Criar branch
git checkout -b feature/nome-feature

# 2. Desenvolver com hot reload
pnpm run dev:monitor  # Frontend apenas
pnpm run dev          # Todos os pacotes

# 3. Validar continuamente
pnpm lint:fix
pnpm type-check

# 4. Testar
pnpm test

# 5. Build local
pnpm build

# 6. Commit
git add .
git commit -m "feat: descrição da feature"
```

#### 3. Atualização de Dados

```bash
# SEMANAL (incremental)
cd packages/etlpython
pnpm run etl:despesasdeputados:pc 57 --incremental
pnpm run etl:materialize:all

# Verificar
cd ../monitor-despesas-next
pnpm run cache:manifests:refresh
pnpm run cache:publish:dry-run

# Reiniciar dev server (F5 no navegador)
```

### 🐛 Técnicas de Debug

#### Debug 1: Problemas de Cache

**Sintoma:** Dados desatualizados no frontend

```bash
# 1. Verificar manifests
cat packages/monitor-despesas-next/public/cache/caches-manifest.json

# 2. Verificar hashes
pnpm --filter @a-republica/monitor-despesas-next cache:publish:dry-run

# 3. Limpar cache do navegador
# DevTools → Application → Clear Storage

# 4. Limpar ISR cache do Next.js
rm -rf packages/monitor-despesas-next/.next/cache

# 5. Rebuild
pnpm run build:web
```

#### Debug 2: Erros no ETL

**Sintoma:** ETL falha ou retorna dados incorretos

```bash
# 1. Validar contratos primeiro (detecta breaking changes na API)
pnpm run contracts:validate --live

# 2. Testar com amostra pequena
pnpm run etl:despesasdeputados:pc 57 1  # Apenas 1 deputado

# 3. Verificar logs
tail -f bancoDados/monitordespesas/_etl-run.log.jsonl

# 4. Inspecionar manifest
cat bancoDados/monitordespesas/_etl-run-manifest.json | jq

# 5. Debuggar Python
cd packages/etlpython
.venv/Scripts/python.exe -m pdb -m etlpython camara 57 1
```

#### Debug 3: Erros de Tipo (TypeScript)

**Sintoma:** Erros de tipo no frontend

```bash
# 1. Type-check completo
pnpm run type-check

# 2. Rebuild shared types
pnpm --filter @a-republica/shared build

# 3. Verificar imports
grep -r "from '@a-republica/shared'" packages/monitor-despesas-next/src/

# 4. Limpar builds
pnpm clean
pnpm install
pnpm build

# 5. Restart TS Server (VS Code)
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

#### Debug 4: Performance Issues

**Sintoma:** Página lenta ou travando

```bash
# 1. Analisar bundle
cd packages/monitor-despesas-next
cross-env ANALYZE=true pnpm run build:web

# 2. Profile React no DevTools
# React DevTools → Profiler → Record

# 3. Verificar tamanho dos caches
cd public/cache
ls -lh *.json
ls -lh transactions/*.json | wc -l  # Contar arquivos

# 4. Medir performance do Next.js
# DevTools → Lighthouse → Run

# 5. Logs do servidor
tail -f .next/server.log
```

### 📝 Padrões de Código

#### Pattern 1: Server Actions

```typescript
// ❌ ERRADO: Fetch direto no Client Component
'use client'
export function MyComponent() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/cache/deputies-cache.json')
      .then(r => r.json())
      .then(setData)
  }, [])
}

// ✅ CORRETO: Server Action + Props
// page.tsx (Server Component)
import { getDeputados } from '../actions/data-actions'

export default async function Page() {
  const { deputados } = await getDeputados()
  return <MyPageClient deputados={deputados} />
}

// MyPageClient.tsx
'use client'
export function MyPageClient({ deputados }: Props) {
  return <List items={deputados} />
}
```

#### Pattern 2: Filtragem Client-Side

```typescript
// ❌ ERRADO: Re-fetch por filtro
const handleFilter = async (filter) => {
  const data = await fetch(`/api/deputados?filter=${filter}`)
  setData(data)
}

// ✅ CORRETO: Filtrar dados já carregados
const [isPending, startTransition] = useTransition()

const deputadosFiltrados = useMemo(() => {
  return deputados.filter(d => d.partido === partidoFilter)
}, [deputados, partidoFilter])

const handleFilter = (filter) => {
  startTransition(() => {
    setPartidoFilter(filter)
  })
}
```

#### Pattern 3: Tipos Compartilhados

```typescript
// ❌ ERRADO: Duplicar tipos
// frontend/types.ts
interface Deputado {
  id: string
  nome: string
}

// backend/types.ts
interface Deputado {  // Duplicado!
  id: string
  nome: string
}

// ✅ CORRETO: Shared package
// packages/shared/src/types/deputado.ts
export interface DeputadoResumo {
  id: string
  nome: string
  totalGasto: number
  gastosPorAno?: Record<number, number>
}

// Usar em todos os lugares
import type { DeputadoResumo } from '@a-republica/shared'
```

### 🔍 Debugging Tools Recomendadas

```json
// VS Code extensions
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "PKief.material-icon-theme",
    "GitHub.copilot"
  ]
}
```

```json
// VS Code settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.defaultInterpreterPath": "./packages/etlpython/.venv/Scripts/python.exe",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 📊 Métricas de Qualidade

**Checklist antes de PR/Commit:**

```bash
# 1. Linting
pnpm lint:fix

# 2. Type-checking
pnpm type-check

# 3. Tests (quando disponíveis)
pnpm test

# 4. Build
pnpm build

# 5. Bundle size (frontend)
cd packages/monitor-despesas-next
pnpm run build:web
# Verificar: First Load JS < 200 KB
```

---

## 📚 Documentação Relacionada

- **Arquitetura:** `docs/01-architecture/ARQUITETURA.md`
- **ETL Overview:** `docs/ETL_OVERVIEW.md`
- **ETL Incremental:** `docs/ETL_INCREMENTAL_POR_ANO.md`
- **Caches:** `docs/01-architecture/GUIA_COMPLETO_CACHES.md`
- **Otimizações:** `docs/07-planning/OPTIMIZATION_ROADMAP.md`
- **Setup Python:** `packages/etlpython/SETUP.md`
- **Agents Guide:** `docs/04-agents/README.md`

---

## ✅ Checklist de Onboarding

Para novos desenvolvedores:

- [ ] Ler `README.md` do projeto
- [ ] Ler esta FAQ
- [ ] Ler `docs/01-architecture/ARQUITETURA.md`
- [ ] Setup ambiente (`pnpm install` + `migrate-venv`)
- [ ] Rodar ETL de teste (10 deputados)
- [ ] Materializar caches
- [ ] Rodar frontend local
- [ ] Explorar código com VS Code
- [ ] Fazer primeiro commit de teste
- [ ] Ler docs de agents específicos

---

**Contribuidores:** A República Team  
**Manutenção:** Atualizar quando houver mudanças significativas no workflow
