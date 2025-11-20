# 📚 Índice de Documentação - A República

> **Guia completo de toda a documentação do projeto**

---

## 🎯 Por Onde Começar?

### Para Desenvolvedores Humanos
1. **[README.md](../README.md)** - Visão geral e quick start
2. **[CONTRIBUTING.md](../05-governance/CONTRIBUTING.md)** - Como contribuir
3. **[ARQUITETURA.md](../01-architecture/ARQUITETURA.md)** - Entender o sistema

### Para Agentes IA
1. **[AI_AGENT_MANUAL.md](../04-agents/AI_AGENT_MANUAL.md)** - Manual completo para IA
2. **[QUICK_START_PROMPT.md](../06-guides/QUICK_START_PROMPT.md)** - Prompt de inicialização
3. **[.ai-guidelines.md](../11-tools/.ai-guidelines.md)** - Padrões de código

---

## 📖 Documentação Principal

### Documentos na Raiz do Projeto

| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| **[README.md](../README.md)** | Visão geral do projeto, quick start, arquitetura resumida | Sempre primeiro |
| **[CONTRIBUTING.md](../05-governance/CONTRIBUTING.md)** | Guia de contribuição, padrões, processo de PR | Antes de contribuir |
| **[AI_AGENT_MANUAL.md](../04-agents/AI_AGENT_MANUAL.md)** | Manual completo para agentes IA | Se você é uma IA |
| **[QUICK_START_PROMPT.md](../06-guides/QUICK_START_PROMPT.md)** | Prompts de inicialização para IA | Início de cada conversa |
| **[OPTIMIZATION_ROADMAP.md](../07-planning/OPTIMIZATION_ROADMAP.md)** | Plano de otimizações futuras | Planejar melhorias |
| **[.ai-guidelines.md](../11-tools/.ai-guidelines.md)** | Padrões de código para desenvolvimento com IA | Antes de codificar |

### Documentos em docs/

| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| **[ARQUITETURA.md](../01-architecture/ARQUITETURA.md)** | Arquitetura detalhada do sistema, decisões de design | Entender o sistema |
| **[GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md)** | Sistema de caches, como usar, estrutura | Trabalhar com dados |
| **[INDEX.md](INDEX.md)** | Este arquivo - índice de toda documentação | Encontrar documentos |

---

## 🗂️ Organização por Tópico

### 1️⃣ Começando

**Primeira vez no projeto?**
1. Leia [README.md](../README.md)
2. Configure ambiente seguindo [README.md#quick-start](../README.md#-quick-start)
3. Entenda arquitetura em [ARQUITETURA.md](../01-architecture/ARQUITETURA.md)

**É um agente IA?**
1. Leia [AI_AGENT_MANUAL.md](../04-agents/AI_AGENT_MANUAL.md)
2. Use [QUICK_START_PROMPT.md](../06-guides/QUICK_START_PROMPT.md) em cada conversa
3. Siga [.ai-guidelines.md](../11-tools/.ai-guidelines.md)

---

### 2️⃣ Arquitetura e Design

**Entender o Sistema:**
- [ARQUITETURA.md](../01-architecture/ARQUITETURA.md) - Arquitetura completa em 8 camadas
- [README.md#arquitetura](../README.md#-arquitetura-do-sistema) - Diagrama resumido

**Decisões de Design:**
- [ARQUITETURA.md#decisões-de-design](../01-architecture/ARQUITETURA.md#-decisões-de-design)
- [GUIA_COMPLETO_CACHES.md#por-que-cache-em-camadas](../01-architecture/GUIA_COMPLETO_CACHES.md#por-que-cache-em-camadas)

---

### 3️⃣ Desenvolvimento

**Padrões de Código:**
- [.ai-guidelines.md](../11-tools/.ai-guidelines.md) - Padrões completos
- [CONTRIBUTING.md#padrões-de-código](../05-governance/CONTRIBUTING.md#-padrões-de-código)

**Como Contribuir:**
- [CONTRIBUTING.md](../05-governance/CONTRIBUTING.md) - Processo completo
- [CONTRIBUTING.md#processo-de-pull-request](../05-governance/CONTRIBUTING.md#-processo-de-pull-request)

**Desenvolvimento com IA:**
- [AI_AGENT_MANUAL.md](../04-agents/AI_AGENT_MANUAL.md) - Manual completo
- [.ai-guidelines.md](../11-tools/.ai-guidelines.md) - Guidelines específicas
- [QUICK_START_PROMPT.md](../06-guides/QUICK_START_PROMPT.md) - Prompts prontos

---

### 4️⃣ Sistema de Dados

**Caches:**
- [GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md) - Guia completo
- [ARQUITETURA.md#camada-5-cache-layer](../01-architecture/ARQUITETURA.md#camada-5-cache-layer)

**ETL (Python):**
- [README.md#executar-etl](../README.md#executar-etl-extração-de-dados)
- [ARQUITETURA.md#camada-2-etl](../01-architecture/ARQUITETURA.md#camada-2-etl-python)

**Materialização:**
- [GUIA_COMPLETO_CACHES.md#geração-de-caches](../01-architecture/GUIA_COMPLETO_CACHES.md#-geração-de-caches)
- [ARQUITETURA.md#camada-4-materialização](../01-architecture/ARQUITETURA.md#camada-4-materialização)

---

### 5️⃣ Frontend

**Componentes:**
- [ARQUITETURA.md#camada-7-frontend](../01-architecture/ARQUITETURA.md#camada-7-frontend-react)
- [AI_AGENT_MANUAL.md#componentes-react](../04-agents/AI_AGENT_MANUAL.md#-componentes-react)

**Hooks:**
- [GUIA_COMPLETO_CACHES.md#uso-no-frontend](../01-architecture/GUIA_COMPLETO_CACHES.md#-uso-no-frontend)
- [AI_AGENT_MANUAL.md#conceitos-chave](../04-agents/AI_AGENT_MANUAL.md#-conceitos-chave-que-você-deve-entender)

**GlobalCacheService:**
- [GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md)
- [AI_AGENT_MANUAL.md#globalcacheservice](../04-agents/AI_AGENT_MANUAL.md#1-globalcacheservice--crítico)

---

### 6️⃣ Otimização

**Roadmap:**
- [OPTIMIZATION_ROADMAP.md](../07-planning/OPTIMIZATION_ROADMAP.md) - Plano completo

**Performance:**
- [OPTIMIZATION_ROADMAP.md#fase-1-performance-frontend](../07-planning/OPTIMIZATION_ROADMAP.md#fase-1-performance-frontend-prioridade-alta)
- [ARQUITETURA.md#performance](../01-architecture/ARQUITETURA.md#-performance)

**Próximos Passos:**
- [OPTIMIZATION_ROADMAP.md#próximos-passos-imediatos](../07-planning/OPTIMIZATION_ROADMAP.md#-próximos-passos-imediatos)

---

### 7️⃣ Testes

**Estratégia:**
- [CONTRIBUTING.md#testes](../05-governance/CONTRIBUTING.md#-testes)
- [OPTIMIZATION_ROADMAP.md#testes-automatizados](../07-planning/OPTIMIZATION_ROADMAP.md#43-testes-automatizados)

**Como Escrever:**
- [.ai-guidelines.md#testes](../11-tools/.ai-guidelines.md#-testes)

---

### 8️⃣ Troubleshooting

**Problemas Comuns:**
- [AI_AGENT_MANUAL.md#como-debugar-problemas](../04-agents/AI_AGENT_MANUAL.md#-como-debugar-problemas)
- [AI_AGENT_MANUAL.md#erros-comuns](../04-agents/AI_AGENT_MANUAL.md#-erros-comuns-e-como-evitar)

**Debug:**
- [GUIA_COMPLETO_CACHES.md#debugging](../01-architecture/GUIA_COMPLETO_CACHES.md#debugging)

---

## 🔍 Busca Rápida

### Procurando por...

**"Como começar?"**
→ [README.md](../README.md)

**"Como funciona o sistema?"**
→ [ARQUITETURA.md](../01-architecture/ARQUITETURA.md)

**"Como contribuir?"**
→ [CONTRIBUTING.md](../05-governance/CONTRIBUTING.md)

**"Como usar caches?"**
→ [GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md)

**"Sou uma IA, o que fazer?"**
→ [AI_AGENT_MANUAL.md](../04-agents/AI_AGENT_MANUAL.md)

**"Quais otimizações fazer?"**
→ [OPTIMIZATION_ROADMAP.md](../07-planning/OPTIMIZATION_ROADMAP.md)

**"Quais padrões seguir?"**
→ [.ai-guidelines.md](../11-tools/.ai-guidelines.md)

**"Como iniciar conversa com IA?"**
→ [QUICK_START_PROMPT.md](../06-guides/QUICK_START_PROMPT.md)

---

## 📊 Mapa Mental da Documentação

```
A República - Documentação
│
├── 🚀 Início
│   ├── README.md (visão geral)
│   ├── CONTRIBUTING.md (como contribuir)
│   └── QUICK_START_PROMPT.md (prompt IA)
│
├── 🏗️ Arquitetura
│   ├── ARQUITETURA.md (detalhado)
│   └── GUIA_COMPLETO_CACHES.md (sistema de dados)
│
├── 🤖 Para Agentes IA
│   ├── AI_AGENT_MANUAL.md (manual completo)
│   ├── .ai-guidelines.md (padrões)
│   └── QUICK_START_PROMPT.md (prompts)
│
├── 🔧 Desenvolvimento
│   ├── .ai-guidelines.md (padrões código)
│   ├── CONTRIBUTING.md (processo)
│   └── .eslintrc.json (linting)
│
└── 🚀 Otimização
    └── OPTIMIZATION_ROADMAP.md (roadmap)
```

---

## 📝 Checklist de Leitura

### Para Novos Desenvolvedores

- [ ] Ler [README.md](../README.md)
- [ ] Configurar ambiente
- [ ] Ler [ARQUITETURA.md](../01-architecture/ARQUITETURA.md)
- [ ] Ler [CONTRIBUTING.md](../05-governance/CONTRIBUTING.md)
- [ ] Ler [.ai-guidelines.md](../11-tools/.ai-guidelines.md)
- [ ] Fazer primeiro PR

### Para Agentes IA

- [ ] Ler [AI_AGENT_MANUAL.md](../04-agents/AI_AGENT_MANUAL.md)
- [ ] Salvar [QUICK_START_PROMPT.md](../06-guides/QUICK_START_PROMPT.md)
- [ ] Ler [.ai-guidelines.md](../11-tools/.ai-guidelines.md)
- [ ] Ler [GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md)
- [ ] Começar a trabalhar

---

## 🔄 Manutenção da Documentação

### Quando Atualizar

**Sempre que:**
- Adicionar nova feature importante
- Mudar arquitetura
- Adicionar novo padrão
- Criar nova documentação

**Como Atualizar:**
1. Atualizar documento relevante
2. Atualizar este INDEX.md se necessário
3. Atualizar README.md se for mudança grande
4. Commit: `docs: update [nome do documento]`

---

## 📞 Ajuda

**Não encontrou o que procura?**
1. Use Ctrl+F neste documento
2. Procure no [README.md](../README.md)
3. Abra uma issue com tag `documentation`

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0
**Mantenedores:** A República Team