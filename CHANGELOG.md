# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - 2024-01-XX

### 🎯 Otimização da Stack

#### Removido
- **immer** (^10.1.3) - Zustand já possui middleware immer nativo
- **lighthouse** (^13.0.1) - Ferramenta CLI, não deve ser dependência de runtime
- **chrome-launcher** (^1.2.1) - Dependência transitiva de lighthouse, não utilizada
- **cli** (^1.0.1) - Pacote não utilizado no projeto

#### Mudado
- **Ambiente Virtual Python**: Movido da raiz do projeto para `packages/etlpython/.venv/`
  - Melhora organização do monorepo
  - Evita poluição do diretório raiz
  - Facilita gerenciamento de dependências Python

#### Adicionado
- **docs/STACK_OPTIMIZATION.md** - Documentação completa das otimizações
- **packages/etlpython/SETUP.md** - Guia de setup do ambiente Python
- **packages/etlpython/migrate-venv.ps1** - Script de migração para Windows
- **packages/etlpython/migrate-venv.sh** - Script de migração para Linux/Mac
- **.gitignore** - Atualizado para ignorar ambiente Python na raiz

### 📊 Impacto

- **Bundle Size**: Redução de ~80KB
- **Dependências**: Redução de 28 para 24 (-14%)
- **node_modules**: Redução de ~20MB
- **Organização**: Ambiente Python isolado no pacote correto

### 🔧 Migração

Para migrar o ambiente Python existente:

**Windows:**
```powershell
cd packages/etlpython
.\migrate-venv.ps1
```

**Linux/Mac:**
```bash
cd packages/etlpython
chmod +x migrate-venv.sh
./migrate-venv.sh
```

Após a migração, remova os arquivos antigos da raiz:
```bash
# Raiz do projeto
rm -rf Lib Scripts python3 pyvenv.cfg
```

### 📚 Documentação

- Veja [docs/STACK_OPTIMIZATION.md](./docs/STACK_OPTIMIZATION.md) para detalhes completos
- Veja [packages/etlpython/SETUP.md](./packages/etlpython/SETUP.md) para setup Python

---

## Formato

Este changelog segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).