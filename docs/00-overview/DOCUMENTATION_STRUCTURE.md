# 📁 Estrutura de Documentação - A República

## 🗂️ Localização de Todos os Documentos

```
a-republica/
│
├── 📄 README.md                          # ⭐ INÍCIO AQUI - Visão geral do projeto
│
├── 📂 docs/                              # 📚 Documentação técnica organizada
│   ├── 📂 00-overview/                   # Navegação e mapas
│   │   ├── 📄 INDEX.md                   # Índice central de conteúdos
│   │   └── 📄 DOCUMENTATION_STRUCTURE.md # Este arquivo
│   ├── 📂 01-architecture/               # Arquitetura do sistema e dados
│   │   ├── 📄 ARQUITETURA.md
│   │   ├── 📄 GUIA_COMPLETO_CACHES.md
│   │   └── 📄 REFERENCIA-VISUAL-ARQUITETURA.md
│   ├── 📂 02-data-pipeline/              # Pipeline ETL, materialização e specs
│   │   ├── 📂 00-overview/               # Índices, guias rápidos e inventário
│   │   ├── 📂 01-operations/             # Operações, CI/CD e comandos
│   │   ├── 📂 02-guides/                 # Guias de execução
│   │   ├── 📂 03-analysis/               # Diagnósticos e comparativos
│   │   ├── 📂 04-plans/                  # Planos de ação e correções
│   │   ├── 📂 05-reference/              # Referências normativas e mapeamentos
│   │   └── 📂 06-specifications/         # Especificações (inclui kiro/specs)
│   ├── 📂 03-frontend/                   # Guias, planos e notas do frontend
│   ├── 📂 04-agents/                     # Materiais para agentes IA
│   ├── 📂 05-governance/                 # Processos e políticas de contribuição
│   ├── 📂 06-guides/                     # Guias rápidos e prompts
│   ├── 📂 07-planning/                   # Roadmaps e planos estratégicos
│   ├── 📂 08-status/                     # Relatórios de status e integrações
│   ├── 📂 09-audits/                     # Auditorias e verificações
│   ├── 📂 10-performance/                # Logs e relatórios de performance
│   ├── 📂 11-tools/                      # Guidelines e instruções para IA
│   ├── 📂 12-validation/                 # Relatórios de validação de dados
│   └── 📂 13-templates/                  # Templates operacionais e de issues
│
├── 📂 .github/...
│
├── 📂 packages/
│   ├── 📂 etlpython/
│   └── 📂 monitor-despesas-next/
│
└── 📂 bancoDados/
    └── 📂 monitordespesas/
```

---

## 📊 Mapa de Documentação por Categoria

### 🎯 Navegação Essencial

| Arquivo | Localização | Propósito |
|---------|-------------|-----------|
| **README.md** | `/` | Visão geral, quick start e arquitetura resumida |
| **INDEX.md** | `/docs/00-overview/` | Índice central da documentação |
| **DOCUMENTATION_STRUCTURE.md** | `/docs/00-overview/` | Este arquivo - mapa completo |

### 🏗️ Fundamentos Técnicos

| Arquivo | Localização | Propósito |
|---------|-------------|-----------|
| **ARQUITETURA.md** | `/docs/01-architecture/` | Arquitetura detalhada do sistema |
| **GUIA_COMPLETO_CACHES.md** | `/docs/01-architecture/` | Sistema de caches completo |
| **REFERENCIA-VISUAL-ARQUITETURA.md** | `/docs/01-architecture/` | Diagramas e fluxos visuais |

### 🔄 Pipeline de Dados (ETL)

| Diretório | Destaques |
|-----------|-----------|
| `/docs/02-data-pipeline/00-overview/` | README do ETL, índice e inventário de pipelines |
| `/docs/02-data-pipeline/01-operations/` | Comandos operacionais, CI/CD e storage |
| `/docs/02-data-pipeline/04-plans/` | Planos de correção, limpeza e refatoração |
| `/docs/02-data-pipeline/06-specifications/` | Specs completas (kiro) e tarefas estruturadas |

### 🤖 Operações com IA

| Arquivo | Localização | Propósito |
|---------|-------------|-----------|
| **AI_AGENT_MANUAL.md** | `/docs/04-agents/` | Manual completo para agentes IA |
| **QUICK_START_PROMPT.md** | `/docs/06-guides/` | Prompt inicial para agentes IA |
| **.ai-guidelines.md** | `/docs/11-tools/` | Padrões de código e conduta para IA |

### 📋 Governança e Planejamento

| Área | Localização | Conteúdo |
|------|-------------|-----------|
| **Contribuição** | `/docs/05-governance/CONTRIBUTING.md` | Processo de PR, padrões e testes |
| **Planejamento** | `/docs/07-planning/OPTIMIZATION_ROADMAP.md` | Roadmap de otimização |
| **Status** | `/docs/08-status/` | Relatórios de progresso e integrações |
| **Templates** | `/docs/13-templates/` | Modelos operacionais e de issues |

---

## 🎯 Fluxo de Navegação Recomendado

### Para Desenvolvedores Humanos

```
1. README.md (raiz)
   ↓
2. docs/00-overview/INDEX.md (navegação)
   ↓
3. docs/01-architecture/ARQUITETURA.md (compreender o sistema)
   ↓
4. docs/05-governance/CONTRIBUTING.md (como contribuir)
   ↓
5. docs/11-tools/.ai-guidelines.md (padrões de execução)
```

### Para Agentes IA

```
1. docs/04-agents/AI_AGENT_MANUAL.md (manual completo)
   ↓
2. docs/06-guides/QUICK_START_PROMPT.md (prompt inicial)
   ↓
3. docs/11-tools/.ai-guidelines.md (padrões obrigatórios)
   ↓
4. docs/01-architecture/GUIA_COMPLETO_CACHES.md (dados e caches)
```

---

## 📍 Caminhos Absolutos

### Windows (PowerShell)

```powershell
# Raiz do projeto
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\

# Documentação principal
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\README.md
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\04-agents\AI_AGENT_MANUAL.md

# Documentação técnica
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\00-overview\INDEX.md
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\01-architecture\ARQUITETURA.md
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\01-architecture\GUIA_COMPLETO_CACHES.md

# ETL
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython\

# Datalake
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\
```

### Caminhos Relativos (a partir da raiz)

```
./README.md
./docs/00-overview/INDEX.md
./docs/01-architecture/ARQUITETURA.md
./docs/04-agents/AI_AGENT_MANUAL.md
./docs/05-governance/CONTRIBUTING.md
./docs/07-planning/OPTIMIZATION_ROADMAP.md
./packages/etlpython/
./bancoDados/monitordespesas/
```

---

## 🔧 Comandos Corrigidos

### Comando ETL Materialização

```powershell
# Navegar para o diretório do ETL
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

# Executar materialização (caminhos corrigidos)
py -m etlpython.cli.materialize_monitordespesasDf `
  --legislatura 57 `
  --cache-version 2025-11-01 `
  --fornecedores-dataset "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\fornecedores.json" `
  --deputados-dataset "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\deputados.json"
```

**Correções aplicadas:**
- ✅ Caminhos relativos normalizados (`..\..`)
- ✅ Aspas para lidar com espaços
- ✅ Quebra de linha com backtick `

### Alternativa com Caminhos Absolutos

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

py -m etlpython.cli.materialize_monitordespesasDf `
  --legislatura 57 `
  --cache-version 2025-11-01 `
  --fornecedores-dataset "C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\camaraDeputados\fornecedores.json" `
  --deputados-dataset "C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\deputados.json"
```

### Usando pnpm (Recomendado)

```powershell
# A partir da raiz do projeto
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica'

# Executar via pnpm
cd packages\etlpython
pnpm run etl:materialize:unified:v2
```

---

## 📝 Atalhos Úteis

### Abrir Documentação Rapidamente

```powershell
# Abrir README principal
code README.md

# Abrir índice de documentação
code docs\00-overview\INDEX.md

# Abrir manual de IA
code docs\04-agents\AI_AGENT_MANUAL.md

# Abrir docs fundamentais
docs\01-architecture\ARQUITETURA.md docs\01-architecture\GUIA_COMPLETO_CACHES.md
```

### Navegar Diretórios

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica'   # Raiz
Set-Location docs\02-data-pipeline\01-operations                             # Operações ETL
Set-Location docs\03-frontend\02-implementation                               # Implementações frontend
Set-Location docs\05-governance                                               # Governança
Set-Location ..\..                                                            # Voltar para raiz
```

---

## 🔍 Busca Rápida de Documentos

### Por Tópico

| Procurando | Arquivo | Caminho |
|------------|---------|---------|
| Visão geral | README.md | `/` |
| Índice central | INDEX.md | `/docs/00-overview/` |
| Arquitetura | ARQUITETURA.md | `/docs/01-architecture/` |
| Caches | GUIA_COMPLETO_CACHES.md | `/docs/01-architecture/` |
| Pipeline ETL | README.md (ETL) | `/docs/02-data-pipeline/00-overview/` |
| Manual IA | AI_AGENT_MANUAL.md | `/docs/04-agents/` |
| Prompt IA | QUICK_START_PROMPT.md | `/docs/06-guides/` |
| Padrões IA | .ai-guidelines.md | `/docs/11-tools/` |
| Roadmap | OPTIMIZATION_ROADMAP.md | `/docs/07-planning/` |

### Por Persona

**Sou desenvolvedor novo:**
1. `/README.md`
2. `/docs/00-overview/INDEX.md`
3. `/docs/01-architecture/ARQUITETURA.md`
4. `/docs/05-governance/CONTRIBUTING.md`

**Sou agente IA:**
1. `/docs/04-agents/AI_AGENT_MANUAL.md`
2. `/docs/06-guides/QUICK_START_PROMPT.md`
3. `/docs/11-tools/.ai-guidelines.md`
4. `/docs/01-architecture/GUIA_COMPLETO_CACHES.md`

**Quero otimizar:**
1. `/docs/07-planning/OPTIMIZATION_ROADMAP.md`
2. `/docs/01-architecture/ARQUITETURA.md#-performance`

**Quero trabalhar com dados:**
1. `/docs/02-data-pipeline/00-overview/README.md`
2. `/docs/02-data-pipeline/01-operations/CONGRESSO-ETL-COMANDOS.md`
3. `/docs/01-architecture/GUIA_COMPLETO_CACHES.md#camada-5-cache-layer`

---

## ✅ Checklist de Documentação

### Documentos Essenciais (Sempre Leia)

- [ ] README.md
- [ ] docs/00-overview/INDEX.md
- [ ] docs/04-agents/AI_AGENT_MANUAL.md (se for IA)
- [ ] docs/05-governance/CONTRIBUTING.md (antes de contribuir)
- [ ] docs/11-tools/.ai-guidelines.md

### Documentos Técnicos (Conforme Necessário)

- [ ] docs/01-architecture/ARQUITETURA.md
- [ ] docs/01-architecture/GUIA_COMPLETO_CACHES.md
- [ ] docs/02-data-pipeline/00-overview/INDICE-DOCUMENTACAO.md
- [ ] docs/07-planning/OPTIMIZATION_ROADMAP.md

---

## 🆘 Ajuda

**Não encontrou o que procura?**

1. Verifique `docs/00-overview/INDEX.md` - índice completo
2. Use a busca global do VS Code (Ctrl+Shift+F)
3. Abra uma issue com a tag `documentation`

**Comando não funciona?**

1. Confirme o diretório de execução (use `Get-Location`)
2. Prefira caminhos absolutos caso haja falhas
3. Utilize aspas quando o caminho contiver espaços
4. No Windows, prefira `\` (backslash) ao invés de `/`

---

**Última atualização:** 2025-11-02
**Versão:** 2.0.0
