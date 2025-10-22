# Cache Unificado - A República Brasileira

## Estrutura de Cache Centralizada

Todo o projeto agora utiliza um **único diretório de cache centralizado**:

```
a-republica-brasileira/
└── a-republica-brasileira-caches/
    ├── latest/          # Cache mais recente (ativo)
    │   ├── suppliers-cache.json
    │   ├── deputies-cache.json
    │   ├── rankings-cache.json
    │   ├── analysis-cache.json
    │   ├── dashboard-cache.json
    │   └── caches-manifest.json
    └── versioned/       # Versões históricas
```

## Benefícios da Unificação

✅ **Organização Única**: Um só local para todos os caches
✅ **Facilita Manutenção**: Backup e limpeza centralizados
✅ **Elimina Confusão**: Não há mais múltiplos diretórios de cache
✅ **Simplicidade**: ETL e MonitorDespesas usam a mesma fonte

## Diretórios Removidos

Os seguintes diretórios de cache foram **consolidados ou removidos**:

- ❌ `monitordespesas/dist/cache/`
- ❌ `monitordespesas/public/cache/`
- ❌ `Sistema ETL/dist/cache_export/`
- ❌ `Sistema ETL/dist/core/cache-exporter/`

## Configuração de Projetos

### Sistema ETL
- Gera cache diretamente em `a-republica-brasileira-caches/latest/`
- Não mantém cópias locais
- Exporta dados processados direto para cache central

### MonitorDespesas
- Lê cache de `a-republica-brasileira-caches/latest/`
- Não duplica dados localmente
- Interface única para dados do ETL

## Metodologia de Cache

- **Fonte Única**: IndexedDB + Cache Central
- **Sem Firestore**: Completamente removido
- **Local First**: Dados salvos localmente apenas
- **ETL ↔ MonitorDespesas**: Relacionamento direto e simples

## Status de Limpeza

✅ **Cache Unificado**: Consolidado em um só local
✅ **Firestore Removido**: Todos arquivos/referências eliminados
✅ **Código Limpo**: Comentários obsoletos removidos
✅ **Estrutura Simples**: Metodologia única de cache

---

Data de criação: 2025-10-02
Sistema: Cache Local Unificado
Projetos: Sistema ETL + MonitorDespesas