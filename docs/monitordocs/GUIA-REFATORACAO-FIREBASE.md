# 🔧 GUIA DE REFATORAÇÃO - Remover Firebase Completamente

## 🎯 Objetivo

Remover TODAS as referências ao Firebase e fazer o frontend consumir apenas os caches do Sistema ETL.

## 📝 Checklist de Refatoração

### Fase 1: Identificar Dependências ✅ FEITO
- [x] Listar todos arquivos que importam Firebase
- [x] Remover Firebase do package.json
- [x] Criar mocks de autenticação

### Fase 2: Refatorar Autenticação ✅ FEITO
- [x] `firebase.ts` - Mock criado
- [x] `authService.ts` - Mock criado  
- [x] `useAuth.tsx` - Atualizado para usar mock
- [x] `firebase.ts` (types) - Removido Timestamp

### Fase 3: Refatorar Data Fetching (TODO)

#### 1. Criar Cache Service
```typescript
// src/shared/services/cacheService.ts
export async function loadCache<T>(cacheName: string): Promise<T> {
  const response = await fetch(`/caches/${cacheName}.json`);
  return response.json();
}
```

#### 2. Atualizar Hooks de Dados

**Hooks a refatorar:**

| Hook | Arquivo | Status | Ação |
|------|---------|--------|------|
| `useETLData` | `core/hooks/useETLData.ts` | ❌ | Trocar Firestore por fetch de cache |
| `useSenadorPerfil` | `senado/hooks/useSenadorPerfil.ts` | ❌ | Buscar de cache JSON |
| `useDeputadoPerfil` | `camara/hooks/useDeputadoPerfil.ts` | ❌ | Buscar de cache JSON |
| `useMateriasLegislativas` | `senado/hooks/useMateriasLegislativasSenador.ts` | ❌ | Buscar de cache JSON |
| `useDiscursosSenador` | `senado/hooks/useDiscursosSenador.ts` | ❌ | Buscar de cache JSON |

#### 3. Atualizar Components/Pages

**Componentes a refatorar:**

- `src/shared/components/debug/FirestoreDebug.tsx` → **DELETAR**
- `src/domains/republica/core/components/dashboards/congressoNacional/board-rankingCongresso.tsx`
- `src/domains/republica/core/pages/BuscarPoliticos.tsx`
- `src/domains/republica/congresso/senado/components/ParlamentarLists/SenadoresListUF.tsx`
- `src/domains/republica/congresso/camara/components/ParlamentarLists/DeputadosListUF.tsx`

#### 4. Atualizar Services

- `src/domains/republica/congresso/camara/services/firestore.service.ts` → Renomear/Refatorar
- `src/domains/republica/congresso/camara/services/legislatura.service.ts`

### Fase 4: Limpar Backend/Core (TODO)

**Diretórios a deletar:**

```
src/core/functions/           # Funções de backend - NÃO USAR
src/core/functions/firebase_functions/
src/core/functions/senado_api_wrapper/
src/core/functions/camara_api_wrapper/
```

**Ação**: Mover para `Sistema ETL` ou deletar completamente.

### Fase 5: Configurar Acesso aos Caches

#### Opção A: Copiar caches para `public/`
```bash
# No Sistema ETL, após gerar caches:
copy-item "../a-republica-brasileira-caches/latest/*" "../a-republica-frontend/public/caches/"
```

#### Opção B: Configurar Vite para servir caches
```typescript
// vite.config.ts
export default defineConfig({
  // ...
  publicDir: '../a-republica-brasileira-caches/latest'
})
```

#### Opção C: Criar endpoint API simples
```typescript
// Simple Express server to serve caches
import express from 'express';
const app = express();
app.use('/api/caches', express.static('../a-republica-brasileira-caches/latest'));
```

## 🔨 Exemplo de Refatoração

### ANTES (com Firebase):
```typescript
// useSenadorPerfil.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';

export function useSenadorPerfil(id: string) {
  return useQuery({
    queryKey: ['senador', id],
    queryFn: async () => {
      const docRef = doc(db, 'senadores', id);
      const snapshot = await getDoc(docRef);
      return snapshot.data();
    }
  });
}
```

### DEPOIS (com Cache):
```typescript
// useSenadorPerfil.ts
import { loadCache } from '@/shared/services/cacheService';

export function useSenadorPerfil(id: string) {
  return useQuery({
    queryKey: ['senador', id],
    queryFn: async () => {
      const senadores = await loadCache<Senador[]>('senadores');
      return senadores.find(s => s.id === id);
    }
  });
}
```

## 📋 Ordem de Execução

1. ✅ **Criar cacheService.ts** (service genérico)
2. ✅ **Refatorar 1 hook simples** (teste)
3. ✅ **Ver se funciona** no browser
4. ✅ **Refatorar demais hooks** seguindo o padrão
5. ✅ **Atualizar páginas/componentes**
6. ✅ **Deletar arquivos Firebase**
7. ✅ **Deletar src/core/functions**
8. ✅ **Testar aplicação completa**

## 🐛 Debugging

### Se encontrar erro de "Cannot find module firebase":
```bash
# Procurar todos imports de firebase
grep -r "from 'firebase" src/

# Ou no Windows:
findstr /s /i "from 'firebase" src\*
```

### Se hooks não funcionarem:
1. Verificar se caches existem
2. Verificar path dos caches
3. Verificar estrutura do JSON
4. Adicionar console.log para debug

## ✅ Validação Final

Quando terminar, verificar:

- [ ] Zero imports de `firebase/` no código
- [ ] Todos hooks buscam de caches JSON
- [ ] Autenticação funciona (mesmo que mock)
- [ ] Páginas carregam sem erros
- [ ] Console do browser sem errors
- [ ] Build funciona (`pnpm build`)
- [ ] `src/core/functions` deletado ou movido

---

**Status Atual**: Fase 2 completa ✅  
**Próximo**: Iniciar Fase 3 - Refatorar Data Fetching
