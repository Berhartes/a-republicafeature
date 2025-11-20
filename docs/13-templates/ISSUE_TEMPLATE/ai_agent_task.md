---
name: 🤖 AI Agent Task
about: Template para tarefas executadas por agentes IA
title: '[AI] '
labels: ai-task
assignees: ''
---

## 🤖 Contexto para Agente IA

```
Agente IA - A República

PROJETO: Sistema de transparência de gastos parlamentares
STACK: Python (ETL) + React 19 + Next.js + TypeScript + Tailwind v4

COMPONENTES-CHAVE:
- GlobalCacheService: src/services/global-cache.service.ts
- useTransactionsPaginated: src/hooks/useTransactionsPaginated.ts
- materialize_unified_v2.py: packages/etlpython/src/etlpython/cli/

PADRÕES:
✅ TypeScript strict (sem 'any')
✅ Dados por ano (gastosPorAno, totalRecebidoPorAno)
✅ Funções < 50 linhas, Componentes < 200 linhas

DOCS: AI_AGENT_MANUAL.md, docs/01-architecture/ARQUITETURA.md, .ai-guidelines.md
```

---

## 📋 Descrição da Tarefa

**Tipo:** 
- [ ] Nova Feature
- [ ] Bug Fix
- [ ] Otimização
- [ ] Refatoração
- [ ] Documentação

**Resumo:**
[Descreva a tarefa em 1-2 frases]

---

## 🎯 Objetivo

**Problema Atual:**
[O que não está funcionando ou o que falta]

**Resultado Esperado:**
[Como deve funcionar após a implementação]

---

## 📁 Arquivos Relevantes

- [ ] `caminho/para/arquivo1.ts`
- [ ] `caminho/para/arquivo2.tsx`
- [ ] `caminho/para/arquivo3.py`

---

## ✅ Requisitos

### Funcionais
- [ ] Requisito funcional 1
- [ ] Requisito funcional 2
- [ ] Requisito funcional 3

### Técnicos
- [ ] Seguir padrões em `.ai-guidelines.md`
- [ ] Usar GlobalCacheService para dados
- [ ] Adicionar tipos TypeScript
- [ ] Escrever testes
- [ ] Atualizar documentação

---

## 🔍 Contexto Adicional

**Tentativas Anteriores:**
[O que já foi tentado, se aplicável]

**Referências:**
- Issue relacionada: #
- PR relacionado: #
- Documentação: [link]

**Prioridade:** 
- [ ] Alta (urgente)
- [ ] Média (importante)
- [ ] Baixa (pode esperar)

---

## 🧪 Critérios de Aceitação

- [ ] Código compila sem erros
- [ ] Testes passam
- [ ] Lint passa
- [ ] Type check passa
- [ ] Funcionalidade testada manualmente
- [ ] Documentação atualizada
- [ ] Segue padrões do projeto

---

## 📝 Notas para o Agente IA

[Qualquer informação adicional que possa ajudar]

---

## 🔗 Checklist Final

Antes de marcar como concluído:

- [ ] Código revisado
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Commit semântico
- [ ] PR criado (se aplicável)
- [ ] Issue atualizada com progresso