# 🤝 Guia de Contribuição - A República

Obrigado por considerar contribuir para o projeto **A República**! Este guia ajudará você a começar.

---

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Padrões de Código](#padrões-de-código)
5. [Processo de Pull Request](#processo-de-pull-request)
6. [Desenvolvimento com IA](#desenvolvimento-com-ia)

---

## 🤝 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

---

## 🚀 Como Contribuir

### Tipos de Contribuição

- 🐛 **Bug Reports**: Encontrou um problema? Abra uma issue
- ✨ **Feature Requests**: Tem uma ideia? Compartilhe conosco
- 📝 **Documentação**: Melhore ou corrija a documentação
- 💻 **Código**: Implemente features ou corrija bugs
- 🧪 **Testes**: Adicione ou melhore testes

### Antes de Começar

1. Verifique se já existe uma issue relacionada
2. Para mudanças grandes, abra uma issue primeiro para discussão
3. Para mudanças pequenas, pode ir direto ao PR

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- pnpm
- Python 3.9+
- Git

### Setup

```bash
# 1. Fork e clone o repositório
git clone https://github.com/seu-usuario/a-republica.git
cd a-republica

# 2. Instalar dependências
pnpm install

# 3. Instalar dependências Python
cd packages/etlpython
pip install -e .
cd ../..

# 4. Criar branch para sua feature
git checkout -b feature/minha-feature
```

### Executar Localmente

```bash
# Frontend
cd packages/monitor-despesas-next
pnpm dev

# ETL (se necessário)
cd packages/etlpython
pnpm run etl:despesasdeputados:pc 57 10
```

---

## 📝 Padrões de Código

### TypeScript

- ✅ Use tipos explícitos (evite `any`)
- ✅ Prefira `interface` para objetos públicos
- ✅ Use `type` para unions e intersections
- ✅ Documente funções complexas com JSDoc

```typescript
// ✅ BOM
interface User {
  id: number
  name: string
}

function getUser(id: number): Promise<User | null> {
  // ...
}

// ❌ RUIM
function getUser(id: any): Promise<any> {
  // ...
}
```

### React

- ✅ Componentes funcionais com hooks
- ✅ Props tipadas com interface
- ✅ Use `memo` para componentes pesados
- ✅ Extraia lógica complexa para hooks customizados

```typescript
// ✅ BOM
interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}
```

### Python

- ✅ Type hints em todas as funções
- ✅ Docstrings para funções públicas
- ✅ Use Pydantic para validação
- ✅ Siga PEP 8

```python
# ✅ BOM
def process_data(items: List[Dict]) -> ProcessedData:
    """
    Process raw data items.
    
    Args:
        items: List of raw data dictionaries
        
    Returns:
        Processed and validated data
    """
    # ...
```

### Commits

Use commits semânticos:

```bash
feat: add global cache service
fix: correct year filter in suppliers page
docs: update README with new architecture
refactor: extract pagination logic to hook
test: add tests for cache service
chore: update dependencies
```

---

## 🔄 Processo de Pull Request

### Checklist

Antes de abrir um PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (`pnpm test`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Type check passa (`pnpm type-check`)
- [ ] Documentação atualizada (se necessário)
- [ ] Commits são semânticos e descritivos
- [ ] Branch está atualizada com `main`

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Screenshots (se aplicável)
[Adicione screenshots]

## Checklist
- [ ] Código testado localmente
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
```

### Processo de Review

1. Abra o PR
2. Aguarde review de um maintainer
3. Faça as mudanças solicitadas
4. PR será merged após aprovação

---

## 🤖 Desenvolvimento com IA

Este projeto é otimizado para desenvolvimento assistido por IA. Siga estas práticas:

### Documentação para IA

```typescript
/**
 * CONTEXT FOR AI:
 * This function deduplicates network requests by maintaining
 * a promise map. Multiple simultaneous calls return the same promise.
 * 
 * REQUIREMENTS:
 * - Must handle race conditions
 * - Must clean up promises after resolution
 * - Must support force refresh
 */
async function fetchData(key: string, forceRefresh = false) {
  // ...
}
```

### TODOs Acionáveis

```typescript
// TODO: Add IndexedDB persistence
// Context: Currently cache is lost on page refresh
// Priority: High
// Estimated: 4 hours
// See: docs/ARCHITECTURE.md#cache-layer
```

### Estrutura Clara

- Um arquivo = Uma responsabilidade
- Funções < 50 linhas
- Componentes < 200 linhas
- Nomes descritivos (não genéricos)

Veja [.ai-guidelines.md](.ai-guidelines.md) para mais detalhes.

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
pnpm test

# Testes específicos
pnpm test -- useGlobalCache

# Coverage
pnpm test:coverage
```

### Escrever Testes

```typescript
describe('GlobalCacheService', () => {
  it('should deduplicate simultaneous requests', async () => {
    const service = new GlobalCacheService()
    
    // Arrange
    const promise1 = service.getSuppliers()
    const promise2 = service.getSuppliers()
    
    // Act
    const [data1, data2] = await Promise.all([promise1, promise2])
    
    // Assert
    expect(data1).toBe(data2) // Same reference
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
```

---

## 📚 Recursos

### Documentação

- [README.md](README.md) - Visão geral do projeto
- [ARQUITETURA.md](../ARQUITETURA.md) - Arquitetura detalhada
- [GUIA_COMPLETO_CACHES.md](../GUIA_COMPLETO_CACHES.md) - Sistema de caches
- [.ai-guidelines.md](.ai-guidelines.md) - Guidelines para IA

### Ferramentas

- **ESLint**: Linting
- **Prettier**: Formatação
- **TypeScript**: Type checking
- **Vitest**: Testing

---

## 💬 Dúvidas?

- Abra uma issue com a tag `question`
- Entre em contato com os maintainers
- Consulte a documentação

---

## 🙏 Agradecimentos

Obrigado por contribuir para tornar os gastos públicos mais transparentes! 🇧🇷

---

**Feito com ❤️ pela comunidade**