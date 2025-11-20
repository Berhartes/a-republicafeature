# 🚀 Plano de Otimização - A República

> Roadmap técnico para otimizações futuras do projeto

---

## 📊 Status Atual

### ✅ Implementado

- [x] Sistema de cache global (GlobalCacheService)
- [x] Paginação de transações
- [x] Separação de dados por ano
- [x] Compressão gzip de caches
- [x] Deduplicação de requisições
- [x] IndexedDB para cache local
- [x] Materialização otimizada (Python)
- [x] Cache de categorias

### 📈 Métricas Atuais

| Métrica | Valor | Objetivo |
|---------|-------|----------|
| Primeira carga | 1.2s | < 1s |
| Navegação | 0.3s | < 0.2s |
| Tamanho caches | ~5MB | < 3MB |
| Requisições duplicadas | 10% | 0% |
| Cobertura de testes | ~40% | > 80% |

---

## 🎯 Fases de Otimização

## FASE 1: Performance Frontend (Prioridade ALTA)

**Objetivo:** Reduzir tempo de carregamento em 50%

### 1.1 Service Worker para Offline-First

**Problema:** Cache perdido ao recarregar página
**Solução:** Implementar Service Worker com estratégia cache-first

**Implementação:**
```typescript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('a-republica-v1').then(cache => {
      return cache.addAll([
        '/cache/suppliers-cache.json',
        '/cache/deputies-cache.json',
        '/cache/categories-cache.json'
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/cache/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request)
      })
    )
  }
})
```

**Impacto:**
- ✅ Carregamento instantâneo após primeira visita
- ✅ Funciona offline
- ✅ Reduz carga no servidor

**Esforço:** 8 horas
**Prioridade:** Alta

---

### 1.2 Compressão Brotli

**Problema:** Gzip reduz ~70%, mas Brotli pode reduzir ~80%
**Solução:** Adicionar compressão Brotli aos caches

**Implementação:**
```python
# packages/etlpython/src/etlpython/cli/materialize_unified_v2.py

import brotli

def write_json_compressed(file_path: Path, data: Any):
    # Gzip (compatibilidade)
    with gzip.open(f"{file_path}.gz", 'wt') as f:
        json.dump(data, f)
    
    # Brotli (melhor compressão)
    json_str = json.dumps(data, ensure_ascii=False)
    compressed = brotli.compress(json_str.encode('utf-8'))
    with open(f"{file_path}.br", 'wb') as f:
        f.write(compressed)
```

**Impacto:**
- ✅ ~30% redução adicional de tamanho
- ✅ Menos banda consumida
- ✅ Carregamento mais rápido

**Esforço:** 4 horas
**Prioridade:** Média

---

### 1.3 Virtual Scrolling para Listas Grandes

**Problema:** Renderizar 500+ itens trava o navegador
**Solução:** Implementar virtual scrolling com react-window

**Implementação:**
```typescript
import { FixedSizeList } from 'react-window'

export function VirtualizedList({ items }: { items: any[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <ItemCard item={items[index]} />
    </div>
  )

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

**Impacto:**
- ✅ Renderiza apenas itens visíveis
- ✅ Performance constante independente do tamanho
- ✅ Scroll suave

**Esforço:** 6 horas
**Prioridade:** Alta

---

### 1.4 Code Splitting e Lazy Loading

**Problema:** Bundle inicial muito grande
**Solução:** Dividir código por rota

**Implementação:**
```typescript
// Antes
import { Dashboard } from './pages/Dashboard'

// Depois
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Suspense>
  )
}
```

**Impacto:**
- ✅ Bundle inicial 60% menor
- ✅ Primeira carga mais rápida
- ✅ Carrega código sob demanda

**Esforço:** 8 horas
**Prioridade:** Alta

---

### 1.5 Otimização de Imagens

**Problema:** Imagens não otimizadas
**Solução:** Usar Next.js Image component + WebP

**Implementação:**
```typescript
// Antes
<img src={deputado.urlFoto} alt={deputado.nome} />

// Depois
import Image from 'next/image'

<Image
  src={deputado.urlFoto}
  alt={deputado.nome}
  width={150}
  height={150}
  loading="lazy"
  placeholder="blur"
/>
```

**Impacto:**
- ✅ ~50% redução de tamanho
- ✅ Lazy loading automático
- ✅ Blur placeholder

**Esforço:** 4 horas
**Prioridade:** Média

---

## FASE 2: Backend e ETL (Prioridade MÉDIA)

### 2.1 Paralelização do ETL

**Problema:** ETL processa deputados sequencialmente
**Solução:** Processar em paralelo com multiprocessing

**Implementação:**
```python
from multiprocessing import Pool

def process_deputy(deputy_id: int) -> Dict:
    # Processar um deputado
    pass

def main():
    deputy_ids = get_all_deputy_ids()
    
    with Pool(processes=4) as pool:
        results = pool.map(process_deputy, deputy_ids)
    
    save_results(results)
```

**Impacto:**
- ✅ 4x mais rápido (com 4 cores)
- ✅ Processa legislatura completa em ~30min

**Esforço:** 12 horas
**Prioridade:** Média

---

### 2.2 Incremental ETL

**Problema:** Re-processa tudo sempre
**Solução:** Processar apenas dados novos

**Implementação:**
```python
def incremental_etl():
    last_run = load_last_run_timestamp()
    
    # Buscar apenas dados novos
    new_data = fetch_data_since(last_run)
    
    # Processar apenas novos
    process_data(new_data)
    
    # Atualizar timestamp
    save_last_run_timestamp(datetime.now())
```

**Impacto:**
- ✅ 90% mais rápido para atualizações
- ✅ Menos carga na API
- ✅ Atualizações mais frequentes

**Esforço:** 16 horas
**Prioridade:** Média

---

### 2.3 Cache de API Responses

**Problema:** Re-busca mesmos dados da API
**Solução:** Cache local de responses da API

**Implementação:**
```python
import requests_cache

# Configurar cache de 1 hora
requests_cache.install_cache(
    'api_cache',
    expire_after=3600
)

# Usar normalmente
response = requests.get(url)  # Cached automaticamente
```

**Impacto:**
- ✅ Menos requisições à API
- ✅ ETL mais rápido em re-runs
- ✅ Respeita rate limits

**Esforço:** 4 horas
**Prioridade:** Baixa

---

### 2.4 Validação de Dados Aprimorada

**Problema:** Dados inconsistentes passam
**Solução:** Validações mais rigorosas com Pydantic

**Implementação:**
```python
from pydantic import validator, Field

class DespesaApi(BaseModel):
    valor: float = Field(gt=0)  # Maior que 0
    cnpj: str = Field(regex=r'^\d{14}$')  # 14 dígitos
    
    @validator('valor')
    def valor_razoavel(cls, v):
        if v > 1_000_000:  # Mais de 1 milhão
            raise ValueError('Valor suspeito')
        return v
```

**Impacto:**
- ✅ Dados mais confiáveis
- ✅ Detecta anomalias cedo
- ✅ Menos bugs no frontend

**Esforço:** 8 horas
**Prioridade:** Média

---

## FASE 3: Análise e Inteligência (Prioridade BAIXA)

### 3.1 Machine Learning para Detecção de Anomalias

**Problema:** Alertas são baseados em regras simples
**Solução:** ML para detectar padrões suspeitos

**Implementação:**
```python
from sklearn.ensemble import IsolationForest

def detect_anomalies(transactions: List[Dict]) -> List[Alert]:
    # Extrair features
    features = extract_features(transactions)
    
    # Treinar modelo
    model = IsolationForest(contamination=0.1)
    model.fit(features)
    
    # Detectar anomalias
    predictions = model.predict(features)
    
    return [
        create_alert(t) 
        for t, p in zip(transactions, predictions) 
        if p == -1
    ]
```

**Impacto:**
- ✅ Detecta padrões complexos
- ✅ Menos falsos positivos
- ✅ Mais insights

**Esforço:** 40 horas
**Prioridade:** Baixa

---

### 3.2 Análise de Rede de Relações

**Problema:** Não visualizamos conexões entre atores
**Solução:** Grafo de relações deputado-fornecedor

**Implementação:**
```python
import networkx as nx

def build_network(transactions: List[Dict]) -> nx.Graph:
    G = nx.Graph()
    
    for t in transactions:
        G.add_edge(
            t['deputado_id'],
            t['fornecedor_id'],
            weight=t['valor']
        )
    
    return G

def find_communities(G: nx.Graph) -> List[Set]:
    return nx.community.greedy_modularity_communities(G)
```

**Impacto:**
- ✅ Identifica clusters suspeitos
- ✅ Visualiza conexões
- ✅ Detecta cartéis

**Esforço:** 32 horas
**Prioridade:** Baixa

---

### 3.3 Análise Temporal e Tendências

**Problema:** Não prevemos tendências
**Solução:** Séries temporais e previsões

**Implementação:**
```python
from statsmodels.tsa.arima.model import ARIMA

def forecast_spending(historical_data: List[float]) -> List[float]:
    model = ARIMA(historical_data, order=(1, 1, 1))
    fitted = model.fit()
    
    # Prever próximos 12 meses
    forecast = fitted.forecast(steps=12)
    
    return forecast.tolist()
```

**Impacto:**
- ✅ Prevê gastos futuros
- ✅ Identifica tendências
- ✅ Alertas proativos

**Esforço:** 24 horas
**Prioridade:** Baixa

---

## FASE 4: Infraestrutura e DevOps (Prioridade MÉDIA)

### 4.1 CI/CD Pipeline

**Problema:** Deploy manual
**Solução:** GitHub Actions para CI/CD

**Implementação:**
```yaml
# .github/workflows/ci.yml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm type-check
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
      - run: pnpm deploy
```

**Impacto:**
- ✅ Deploy automático
- ✅ Testes em cada PR
- ✅ Menos erros em produção

**Esforço:** 8 horas
**Prioridade:** Média

---

### 4.2 Monitoramento e Observabilidade

**Problema:** Não sabemos quando algo quebra
**Solução:** Sentry + Analytics

**Implementação:**
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
})

// Capturar erros automaticamente
function MyComponent() {
  try {
    // ...
  } catch (error) {
    Sentry.captureException(error)
  }
}
```

**Impacto:**
- ✅ Detecta erros em produção
- ✅ Stack traces completos
- ✅ Métricas de performance

**Esforço:** 6 horas
**Prioridade:** Alta

---

### 4.3 Testes Automatizados

**Problema:** Cobertura de testes baixa (~40%)
**Solução:** Aumentar para > 80%

**Áreas Prioritárias:**
1. GlobalCacheService (crítico)
2. Hooks de dados
3. Serviços de materialização
4. Componentes principais

**Implementação:**
```typescript
describe('GlobalCacheService', () => {
  it('should deduplicate simultaneous requests', async () => {
    const service = new GlobalCacheService()
    
    const [data1, data2] = await Promise.all([
      service.getSuppliers(),
      service.getSuppliers()
    ])
    
    expect(data1).toBe(data2)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
```

**Impacto:**
- ✅ Menos bugs
- ✅ Refactoring seguro
- ✅ Documentação viva

**Esforço:** 40 horas
**Prioridade:** Alta

---

## FASE 5: Experiência do Usuário (Prioridade MÉDIA)

### 5.1 PWA (Progressive Web App)

**Problema:** Não funciona como app nativo
**Solução:** Transformar em PWA

**Implementação:**
```json
// public/manifest.json
{
  "name": "A República",
  "short_name": "República",
  "description": "Monitor de Gastos Parlamentares",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**Impacto:**
- ✅ Instalável no celular
- ✅ Funciona offline
- ✅ Notificações push

**Esforço:** 12 horas
**Prioridade:** Média

---

### 5.2 Modo Escuro

**Problema:** Apenas modo claro
**Solução:** Tema escuro com Tailwind

**Implementação:**
```typescript
// Detectar preferência do sistema
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
})

// Aplicar classe
<html className={theme}>
  {/* ... */}
</html>
```

**Impacto:**
- ✅ Melhor para os olhos
- ✅ Economia de bateria (OLED)
- ✅ Preferência do usuário

**Esforço:** 8 horas
**Prioridade:** Baixa

---

### 5.3 Acessibilidade (a11y)

**Problema:** Não testado para acessibilidade
**Solução:** Implementar WCAG 2.1 AA

**Checklist:**
- [ ] Contraste de cores adequado
- [ ] Navegação por teclado
- [ ] Screen reader support
- [ ] ARIA labels
- [ ] Focus indicators

**Impacto:**
- ✅ Acessível para todos
- ✅ SEO melhor
- ✅ Conformidade legal

**Esforço:** 16 horas
**Prioridade:** Média

---

## 📊 Resumo de Prioridades

### Curto Prazo (1-2 meses)

1. ✅ Service Worker (8h)
2. ✅ Virtual Scrolling (6h)
3. ✅ Code Splitting (8h)
4. ✅ Monitoramento (6h)
5. ✅ Testes (40h)

**Total:** ~68 horas

### Médio Prazo (3-6 meses)

1. ✅ Paralelização ETL (12h)
2. ✅ Incremental ETL (16h)
3. ✅ CI/CD (8h)
4. ✅ PWA (12h)
5. ✅ Compressão Brotli (4h)

**Total:** ~52 horas

### Longo Prazo (6-12 meses)

1. ✅ Machine Learning (40h)
2. ✅ Análise de Rede (32h)
3. ✅ Séries Temporais (24h)
4. ✅ Acessibilidade (16h)
5. ✅ Modo Escuro (8h)

**Total:** ~120 horas

---

## 🎯 Métricas de Sucesso

### Performance

| Métrica | Atual | Meta | Melhoria |
|---------|-------|------|----------|
| Primeira carga | 1.2s | 0.6s | 50% |
| Navegação | 0.3s | 0.1s | 67% |
| Tamanho bundle | 800KB | 400KB | 50% |
| Tamanho caches | 5MB | 2MB | 60% |

### Qualidade

| Métrica | Atual | Meta | Melhoria |
|---------|-------|------|----------|
| Cobertura testes | 40% | 80% | 100% |
| Bugs em produção | 5/mês | 1/mês | 80% |
| Tempo de deploy | 30min | 5min | 83% |

### Experiência

| Métrica | Atual | Meta | Melhoria |
|---------|-------|------|----------|
| Lighthouse Score | 75 | 95 | 27% |
| Acessibilidade | 60 | 90 | 50% |
| Offline support | Não | Sim | ∞ |

---

## 📝 Notas de Implementação

### Para Cada Otimização

1. **Medir baseline** antes de começar
2. **Implementar** seguindo padrões
3. **Testar** rigorosamente
4. **Medir novamente** e comparar
5. **Documentar** resultados

### Ferramentas de Medição

- **Lighthouse**: Performance geral
- **React DevTools Profiler**: Performance React
- **Chrome DevTools**: Network, Memory
- **Bundle Analyzer**: Tamanho do bundle
- **Sentry**: Erros em produção

---

## ✅ Próximos Passos Imediatos

1. **Esta semana:**
   - [ ] Implementar Service Worker
   - [ ] Adicionar monitoramento Sentry

2. **Próximas 2 semanas:**
   - [ ] Virtual Scrolling
   - [ ] Code Splitting
   - [ ] Aumentar cobertura de testes para 60%

3. **Próximo mês:**
   - [ ] CI/CD Pipeline
   - [ ] Compressão Brotli
   - [ ] PWA básico

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0
**Responsável:** A República Team