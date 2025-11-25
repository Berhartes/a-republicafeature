# Deputados v2 - Stack Moderna + Design Original

## 🎯 O que é

Uma reimplementação completa da página de listagem de deputados usando as melhores práticas do Next.js 15 e React 19, mantendo a **aparência visual exata** do design original.

## 🚀 Acesse

```
http://localhost:3000/gastos/deputados2
```

## 🎨 Design

✅ **Aparência 100% fiel ao original:**
- Card com gradiente azul no header
- **Borda leve (border-gray-200)** no card
- Foto circular com borda branca e sombra
- Badge de score destacado no topo
- Grid de 3 estatísticas (Total Gasto, Alertas, Score)
- **Botão "Ver Perfil" + Botão Estrela de Favoritar**
- Estrela fica amarela quando favoritado
- Ícones: MapPin, TrendingUp, AlertTriangle, Eye, User, Star

## ✨ Diferenças da v1 (/gastos/deputados)

### Arquitetura

| Aspecto | v1 (deputados) | v2 (deputados2) |
|---------|----------------|-----------------|
| **State Management** | `useUrlSyncedFilters` custom hook | `useSearchParams` nativo + `useTransition` |
| **URL Updates** | Hook complexo com callbacks | `router.push()` direto com `startTransition` |
| **Hydration** | ❌ Mismatch entre server/client | ✅ Sincronizado |
| **Re-renders** | ❌ Loop infinito em alguns casos | ✅ Otimizado |
| **Filtros** | Config object inline (causa re-renders) | Leitura direta de searchParams |

### Principais Melhorias

1. **Sem Hydration Errors**
   - Não há diferenças entre HTML do servidor e cliente
   - Todo o conteúdo dinâmico é consistente

2. **Sem Loops Infinitos**
   - `useTransition` gerencia estado de loading
   - Não há dependencies problemáticas em useEffect
   - Updates de URL não causam re-renders desnecessários

3. **Performance**
   - Transições otimizadas com `startTransition`
   - Componentes mais simples e diretos
   - Menos abstrações = mais rápido

4. **Código Mais Limpo**
   - ~380 linhas vs ~500+ linhas
   - Menos custom hooks
   - Mais fácil de entender e manter

### Problemas Corrigidos da v1

❌ **v1 - Problemas:**
```typescript
// filterConfig recriado a cada render
const filterConfig = useMemo(() => ({...}), [deps])

// applyFilters muda constantemente
useEffect(() => {
  applyFilters(...)
}, [applyFilters, ...]) // Loop!
```

✅ **v2 - Solução:**
```typescript
// Leitura direta, sem estado intermediário
const partido = searchParams.get('partido')

// Update simples e direto
const updateURL = (updates) => {
  startTransition(() => {
    router.push(newURL)
  })
}
```

## 🏗️ Estrutura de Arquivos

```
deputados2/
├── page.tsx          # Server Component - busca dados
└── DeputadosClient.tsx  # Client Component - UI e interação
```

## 🎨 Features

- ✅ Busca por nome
- ✅ Filtro por partido
- ✅ Filtro por UF
- ✅ Ordenação (nome, partido, uf, gasto)
- ✅ Paginação
- ✅ Score de suspeição
- ✅ Contador de alertas
- ✅ Estatísticas em tempo real
- ✅ Loading states com useTransition
- ✅ Responsive design

## 📊 Stack Utilizada

- **Next.js 15** - App Router, Server Components
- **React 19** - useTransition, Suspense
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Componentes
- **Lucide React** - Ícones

## 🔥 Vantagens Técnicas

### Server Components
```typescript
// page.tsx - roda no servidor
const { deputados } = await getDeputados({...})
// Dados já vêm filtrados e paginados
```

### Client Components Otimizados
```typescript
// DeputadosClient.tsx - roda no cliente
const [isPending, startTransition] = useTransition()
// Loading states automáticos
```

### URL State Management
```typescript
// Simples e direto
searchParams.get('partido') // leitura
router.push(newURL) // escrita
```

## 🎯 Quando Usar Cada Versão

### Use v1 (/gastos/deputados) se:
- Você precisa da estética exata da versão antiga
- Está debugando problemas específicos

### Use v2 (/gastos/deputados2) se:
- Quer uma implementação moderna e estável
- Precisa de performance e confiabilidade
- Vai usar como base para novas features

## 🚀 Próximos Passos

1. Testar em produção
2. Adicionar testes automatizados
3. Implementar analytics
4. Adicionar filtros avançados (score mínimo, etc)
5. Substituir v1 por v2 quando estável

## 📝 Notas

- Esta é uma demonstração de como fazer da forma correta
- Use como referência para outras páginas
- A v1 serve como exemplo do que **não** fazer
