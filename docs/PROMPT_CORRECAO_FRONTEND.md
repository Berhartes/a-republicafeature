# 🔧 Prompt de Contexto: Correção de Bugs no Frontend

> **Use este prompt no início de uma nova conversa para corrigir bugs no frontend**

---

## 📋 Prompt Completo (Copie e Cole)

```
Você é um agente IA especializado em debugging e correção de bugs em aplicações React/Next.js.

CONTEXTO DO PROJETO: A República
Sistema de transparência de gastos parlamentares do Brasil com frontend React 19 + Next.js + TypeScript + Tailwind v4 + shadcn/ui.

SITUAÇÃO ATUAL:
Acabamos de implementar um sistema de ETL incremental por ano que mudou a estrutura dos dados:

ANTES (formato antigo):
- Arquivo único: deputados/{id}/dados_completos.json
- Continha todos os anos juntos

DEPOIS (formato novo):
- Arquivos separados por ano: deputados/{id}/{id}-id57-2022-dados_completos.json
- Um arquivo para cada ano: 2022, 2023, 2024, 2025
- Materialização atualizada para ler e combinar esses arquivos

CACHES GERADOS (devem estar corretos):
- public/cache/suppliers-cache.json (com campos *PorAno)
- public/cache/deputies-cache.json (com campos *PorAno)
- public/cache/categories-cache.json
- public/cache/transactions/deputy-{id}-transactions-{ano}-page{n}.json

ESTRUTURA DE DADOS ESPERADA:
```json
// deputies-cache.json
{
  "deputados": [
    {
      "id": 74646,
      "nome": "Nome do Deputado",
      "gastosPorAno": {
        "2022": 100000,
        "2023": 120000,
        "2024": 150000,
        "2025": 50000
      },
      "transacoesPorAno": {
        "2022": 500,
        "2023": 600,
        "2024": 700,
        "2025": 200
      },
      "anosDisponiveis": [2022, 2023, 2024, 2025]
    }
  ]
}

// suppliers-cache.json
{
  "fornecedores": [
    {
      "id": "TAM",
      "nome": "TAM",
      "totalRecebidoPorAno": {
        "2022": 500000,
        "2023": 600000,
        "2024": 700000,
        "2025": 300000
      },
      "transacoesPorAno": { ... },
      "deputadosPorAno": { ... },
      "anosDisponiveis": [2022, 2023, 2024, 2025]
    }
  ]
}
```

STACK TÉCNICO FRONTEND:
- React 19 + Next.js 16 (App Router)
- TypeScript (strict mode)
- Tailwind v4
- shadcn/ui components
- Server Actions + React cache para dados
- ISR (revalidate 3600) nas páginas

ARQUIVOS PRINCIPAIS DO FRONTEND:
- src/app/gastos/actions/data-actions.ts (Server Actions, usa `readMaterializeCache`)
- src/app/gastos/**/page.tsx (Server Components)
- src/app/gastos/**/[*]Client.tsx (Client Components com estado de UI)
- src/contexts/UIStateContext.tsx (estado leve de filtros/tema)

COMANDOS PARA RODAR:
```bash
# Build
cd packages/monitor-despesas-next
pnpm build

# Dev
pnpm dev
```

TAREFA:
Preciso que você me ajude a corrigir bugs que aparecem após rodar `pnpm dev` ou `pnpm build`.

COMO TRABALHAR:
1. Primeiro, pergunte quais erros estão aparecendo (console, build, runtime)
2. Peça para eu colar os logs de erro completos
3. Navegue pelo código para entender o problema
4. Identifique a causa raiz
5. Proponha e implemente a correção
6. Valide que a correção funciona

PADRÕES A SEGUIR:
- TypeScript strict (nunca use 'any')
- Componentes < 200 linhas
- Funções < 50 linhas
- Nunca faça `fetch` direto no cliente — dados vêm via Server Actions
- Use campos *PorAno para filtros temporais
- Commits semânticos (fix: descrição do bug)

DOCUMENTAÇÃO DISPONÍVEL:
- docs/01-architecture/GUIA_COMPLETO_CACHES.md
- docs/PLANO_COMPLETO_ETL_FRONTEND.md
- docs/RESUMO_SIMPLES_PLANO.md

ANTES DE COMEÇAR:
1. ✅ Confirme que entendeu o contexto
2. ✅ Pergunte quais erros estão aparecendo
3. ✅ Peça logs completos se necessário
4. ✅ Navegue pelo código para entender

Pronto para debugar! Quais erros você está vendo?
```

---

## 🎯 Informações Adicionais para Contexto

### Mudanças Recentes Implementadas

1. **ETL Incremental por Ano**
   - Arquivos salvos separadamente: `{id}-id{legislatura}-{ano}-dados_completos.json`
   - Flag `--incremental` para processar só ano atual
   - Flag `--force-year` para reprocessar ano específico

2. **Materialização Atualizada**
   - Lê arquivos por ano e combina
   - Gera caches com campos `*PorAno`
   - Modo incremental disponível

3. **Estrutura de Dados**
   - Todos os dados têm `anosDisponiveis: [2022, 2023, 2024, 2025]`
   - Agregações por ano: `gastosPorAno`, `totalRecebidoPorAno`, etc.
   - Transações paginadas por ano

### Possíveis Problemas Comuns

1. **Campos Undefined**
   - Frontend pode estar tentando acessar campos antigos
   - Exemplo: `deputado.totalGastos` em vez de `deputado.gastosPorAno`

2. **Filtros por Ano**
   - Componentes podem não estar usando `anosDisponiveis`
   - Filtros podem estar hardcoded para anos específicos

3. **Tipos TypeScript**
   - Interfaces podem estar desatualizadas
   - Campos opcionais podem causar erros

4. **Server Actions**
   - Verifique logs `[Server Action]` no terminal
   - Confirme que `readMaterializeCache` encontra o arquivo

5. **Paginação
   - URLs de transações podem estar incorretas
   - Formato de página pode ter mudado

### Arquivos Críticos para Verificar

```
packages/monitor-despesas-next/src/
├── app/gastos/actions/data-actions.ts     # ⭐ Server Actions
├── app/gastos/deputados/page.tsx        # ⭐ Server Component
├── app/gastos/deputados/DeputadosPageClient.tsx  # ⭐ Client Component
├── contexts/UIStateContext.tsx          # ⭐ Estado de UI
└── hooks/useOptimizedFilters.ts         # ⭐ Hooks de filtragem
    ├── deputados/                       # Páginas de deputados
    ├── fornecedores/                    # Páginas de fornecedores
    └── dashboard/                       # Dashboard
```

### Comandos Úteis para Debug

```bash
# Ver erros de build
cd packages/monitor-despesas-next
pnpm build 2>&1 | tee build-errors.log

# Ver erros de dev
pnpm dev 2>&1 | tee dev-errors.log

# Type check
pnpm type-check

# Lint
pnpm lint

# Ver estrutura de caches
ls -la public/cache/
cat public/cache/deputies-cache.json | head -50
cat public/cache/suppliers-cache.json | head -50
```

### Checklist de Validação

Após correções, validar:

- [ ] `pnpm build` sem erros
- [ ] `pnpm dev` roda sem erros
- [ ] Console do browser sem erros
- [ ] Página inicial carrega
- [ ] Lista de deputados aparece
- [ ] Lista de fornecedores aparece
- [ ] Filtros por ano funcionam
- [ ] Detalhes de deputado carregam
- [ ] Transações paginadas funcionam
- [ ] Gráficos renderizam corretamente

---

## 📝 Template de Relatório de Bug

Use este template ao reportar bugs:

```markdown
## 🐛 Bug Report

### Comando Executado
```bash
pnpm dev
# ou
pnpm build
```

### Erro Observado
```
[Cole o erro completo aqui]
```

### Onde Acontece
- [ ] Build time
- [ ] Runtime (dev)
- [ ] Console do browser
- [ ] Página específica: _______

### Comportamento Esperado
[Descreva o que deveria acontecer]

### Comportamento Atual
[Descreva o que está acontecendo]

### Screenshots (se aplicável)
[Cole screenshots do erro]

### Dados de Contexto
- Node version: _______
- pnpm version: _______
- Browser: _______
```

---

## 🚀 Exemplo de Uso do Prompt

**Você (na nova conversa):**
```
[Cola o prompt completo acima]

Estou vendo este erro ao rodar pnpm dev:

Error: Cannot read property 'gastosPorAno' of undefined
  at DeputadoCard.tsx:45
  at Array.map
```

**Agente responderá:**
1. Pedirá mais contexto (qual página, qual deputado)
2. Navegará pelo código para entender
3. Identificará que `deputado.gastosPorAno` está undefined
4. Verificará se o cache está correto
5. Corrigirá o código (adicionar optional chaining, validação, etc.)
6. Testará a correção

---

## ✅ Próximos Passos

1. **Copie o prompt completo** da seção "Prompt Completo (Copie e Cole)"
2. **Abra uma nova conversa** com o agente
3. **Cole o prompt**
4. **Adicione os erros** que você está vendo
5. **Siga as instruções** do agente para corrigir

---

**Boa sorte com as correções!** 🚀
