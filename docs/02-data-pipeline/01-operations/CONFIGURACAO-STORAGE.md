# 📚 GUIA DE CONFIGURAÇÃO DO SISTEMA ETL

## Variáveis de Ambiente

### Firebase
```env
FIREBASE_STORAGE_BUCKET=a-republica-brasileira-aa927.appspot.com
FIREBASE_PROJECT_ID=a-republica-brasileira-aa927
```

### Cache Upload
```env
# Habilita upload automático para Firebase Storage após geração dos caches
UPLOAD_TO_STORAGE=true

# Caminho base no Storage (padrão: monitordespesas/cache)
STORAGE_BASE_PATH=monitordespesas/cache

# Número de versões antigas a manter (padrão: 10)
STORAGE_KEEP_VERSIONS=10
```

### Fallback de Deputados
```env
# Diretório com dados de fallback (para enriquecer nomes oficiais)
DEPUTADOS_FALLBACK_DIR=../a-republica-brasileira2/firestore_fallback
FIRESTORE_FALLBACK_DIR=../a-republica-brasileira2/firestore_fallback
```

## Exemplo de .env completo

```env
# Firebase Configuration
FIREBASE_STORAGE_BUCKET=a-republica-brasileira-aa927.appspot.com
FIREBASE_PROJECT_ID=a-republica-brasileira-aa927

# Upload Configuration
UPLOAD_TO_STORAGE=true
STORAGE_BASE_PATH=monitordespesas/cache
STORAGE_KEEP_VERSIONS=10

# Fallback Data
FIRESTORE_FALLBACK_DIR=../a-republica-brasileira2/firestore_fallback

# API Configuration (opcional)
API_RATE_LIMIT=100
API_TIMEOUT=30000
```

## Comandos de Execução

### Modo Desenvolvimento (local, sem upload)
```bash
npm run etl:despesas:pc -- 57 5
```

### Modo Produção (com upload para Storage)
```bash
# Opção 1: Via flag --firestore (habilita Firestore + Storage)
npm run etl:despesas:pc -- 57 --firestore

# Opção 2: Via variável de ambiente
UPLOAD_TO_STORAGE=true npm run etl:despesas:pc -- 57
```

### Apenas gerar caches (sem ETL completo)
```bash
npm run build
node dist/scripts/generate-caches-only.js
```

## Fluxo Completo

1. **ETL processa dados** → `bancodeDados/despesas_deputados_*.json`
2. **Cache Exporter** → `dist/cache_export/*.json` + `caches-manifest.json`
3. **Storage Uploader** → Firebase Storage (`gs://...bucket.../monitordespesas/cache/`)
   - Cria versão timestampada: `v2025-10-01/`
   - Atualiza "latest": `latest/*.json`
   - Torna arquivos públicos
4. **Frontend consome** → `https://storage.googleapis.com/.../latest/suppliers-cache.json`

## URLs Públicas (após upload)

Base URL: `https://storage.googleapis.com/a-republica-brasileira-aa927.appspot.com/monitordespesas/cache/latest/`

- `suppliers-cache.json` — Lista completa de fornecedores
- `dashboard-cache.json` — Métricas agregadas
- `analysis-cache.json` — Análises e insights
- `deputies-cache.json` — Lista de deputados
- `rankings-cache.json` — Rankings e premiações
- `caches-manifest.json` — Manifest com hashes

## Troubleshooting

### Storage não configurado
```
⚠️ Storage não configurado. Pulando upload.
   Configure FIREBASE_STORAGE_BUCKET no .env para habilitar.
```
**Solução:** Adicione `FIREBASE_STORAGE_BUCKET` no `.env`

### Erro de permissão
```
❌ Falha no upload: Forbidden (403)
```
**Solução:** Verifique se o service account tem permissões `storage.buckets.create` e `storage.objects.create`

### Bucket não existe
```
❌ Bucket do Firebase Storage não existe
```
**Solução:** Crie o bucket no Firebase Console ou via `gsutil mb gs://your-bucket`

## Validação de Configuração

Teste se o Storage está configurado:
```bash
npm run build
node -e "import('./dist/core/cache-exporter/storage-uploader.js').then(m => m.validateStorageConfig())"
```

## Scripts Utilitários

### Limpar versões antigas manualmente
```bash
npm run build
node dist/scripts/cleanup-storage-versions.js
```

### Verificar caches locais
```bash
ls -lh dist/cache_export/
cat dist/cache_export/caches-manifest.json | jq .
```

### Testar upload sem rodar ETL
```bash
npm run build
node dist/scripts/test-storage-upload.js
```
