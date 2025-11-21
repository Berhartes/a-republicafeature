# 🧹 Limpeza Radical em Andamento

## Estratégia

Estamos removendo TUDO que depende de código antigo e deixando apenas o mínimo funcional:

### ✅ Manter
- Server Actions (`app/gastos/actions/data-actions.ts`)
- UIStateContext  
- Páginas migradas (deputados, comparar, premiações, perfil, dashboards, fornecedor)
- Componentes UI básicos (shadcn/ui)

### ❌ Remover
- Todos hooks que usam services antigos
- Todos componentes legados de páginas antigas
- Components de categorias, charts, premiacoes complexos
- Páginas que ainda não foram migradas

### 🎯 Objetivo

Build limpo que compila, mesmo que algumas páginas fiquem indisponíveis temporariamente.
Depois reconstruiremos as páginas necessárias do zero, simples e diretas.

## Progresso

Removendo agora...
