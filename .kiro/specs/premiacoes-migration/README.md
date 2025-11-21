# Spec: Migração da Página de Premiações

## Status: Ready for Implementation

Esta spec define a migração completa da página de Premiações do backup (monitordespesas-backup) para o projeto Next.js atual (monitor-despesas-next) com 100% de fidelidade visual e funcional.

## Documentos

- **[requirements.md](./requirements.md)**: 15 user stories com critérios de aceitação detalhados
- **[design.md](./design.md)**: Arquitetura, componentes, fluxos de dados e estratégias de implementação
- **[tasks.md](./tasks.md)**: 14 tarefas principais com 60+ sub-tarefas de implementação

## Visão Geral

### Objetivo
Reproduzir a página Premiações com 100% de fidelidade ao backup, mantendo a mesma tecnologia (React + Next.js + Tailwind + shadcn/ui).

### Escopo
- **7 componentes principais**: ControlesFiltrosPremiacoes, ExibicaoPremiacoes, RankingsFiltrados, UnifiedRankingDisplay, BannerPremiacaoDeputado, BadgesPremiacaoDeputado, PremiacoesPageModular
- **5 serviços de dados**: unified-ranking-service, premiacao-unificada, premiacoes-processor, etl-cache.service, useEtlDeputadosData hook
- **Funcionalidades**: Filtros (ano/categoria/UF), tabs de premiações (coroas/troféus/medalhas), ranking unificado, painel admin, badges, navegação para perfis

### Tecnologias
- React 18+ com TypeScript
- Next.js 14+ (App Router)
- Tailwind CSS
- shadcn/ui components
- lucide-react icons
- ETL data pipeline com fallback para cache

## Arquitetura

```
PremiacoesPageModular (página principal)
├── Header + Admin Panel
├── Dashboard Stats (4 cards)
└── Main Tabs
    ├── Rankings Tab
    │   ├── ControlesFiltrosPremiacoes
    │   └── RankingsFiltrados
    │       └── UnifiedRankingDisplay
    │           └── BadgesPremiacaoDeputado
    └── Premiações Tab
        ├── BannerPremiacaoDeputado
        └── ExibicaoPremiacoes (tabs: coroas/troféus/medalhas)
```

## Cronograma Estimado

- **Dia 1**: Setup + Services Layer (tasks 1-2)
- **Dia 2**: Hook + Componentes Base (tasks 3-9)
- **Dia 3**: Integração + Visual Fidelity (tasks 10-12)
- **Dia 4**: Testing + Optimization (tasks 13-14)

## Como Começar

1. Abra o arquivo [tasks.md](./tasks.md)
2. Clique em "Start task" na primeira tarefa
3. Siga as instruções detalhadas de cada sub-tarefa
4. Marque como completo quando finalizar
5. Prossiga para a próxima tarefa

## Critérios de Aceitação

### Visual Fidelity
- [ ] Layout idêntico ao backup
- [ ] Cores, espaçamentos e tipografia iguais
- [ ] Ícones e emojis corretos
- [ ] Hover states e transições funcionando
- [ ] Responsivo em mobile/tablet/desktop

### Funcionalidade
- [ ] Filtros funcionam corretamente
- [ ] Tabs alternam sem erros
- [ ] Admin actions executam
- [ ] Navegação para perfis funciona
- [ ] Loading/error states exibem

### Performance
- [ ] Initial load < 2s
- [ ] Filter changes < 300ms
- [ ] Tab switches < 100ms
- [ ] Sem memory leaks

### Dados
- [ ] Rankings calculam corretamente
- [ ] Premiações classificam corretamente
- [ ] Filtros combinam com AND logic
- [ ] Cache fallback funciona
- [ ] Estatísticas precisas

## Referências

- **Backup**: `bbbackup/monitordespesas-backup/src/pages/PremiacoesPageModular.tsx`
- **Next.js atual**: `packages/monitor-despesas-next/src/app/gastos/premiacoes/PremiacoesPageClient.tsx`
- **Tipos**: `packages/monitor-despesas-next/src/types/etl-deputados.types.ts`

## Notas Importantes

- Tarefas marcadas com `*` são opcionais (testes) para acelerar MVP
- Priorize fidelidade visual 100% sobre otimizações prematuras
- Use dados reais do ETL quando disponível, fallback para cache
- Mantenha console.logs para debug durante desenvolvimento
- Documente decisões de design que divergirem do backup

## Contato

Para dúvidas ou esclarecimentos sobre esta spec, consulte os documentos de requirements e design, ou abra uma discussão no projeto.
