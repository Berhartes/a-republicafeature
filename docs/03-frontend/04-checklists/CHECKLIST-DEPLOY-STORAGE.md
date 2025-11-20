# 📋 CHECKLIST DE DEPLOY — Firebase Storage

> **Guia rápido para configuração e validação do pipeline de caches**

---

## ✅ Fase 1: Análise e Implementação (CONCLUÍDA)

- [x] Análise completa do fluxo de dados
- [x] Implementação do módulo de upload
- [x] Atualização do frontend para URLs remotas
- [x] Criação de scripts de teste e utilidade
- [x] Documentação completa
- [x] Build sem erros de compilação

---

## ⏳ Fase 2: Configuração de Infraestrutura (PENDENTE)

### **2.1 — Criar Bucket Firebase Storage**

```bash
# Via gsutil (Google Cloud SDK)
gsutil mb gs://a-republica-brasileira-aa927.appspot.com

# Ou via Firebase Console:
# 1. Acessar https://console.firebase.google.com/
# 2. Selecionar projeto "a-republica-brasileira-aa927"
# 3. Ir em Storage → Get Started
# 4. Escolher região (us-central1 recomendado)
```

- [ ] Bucket criado
- [ ] Região definida
- [ ] Print da tela do Storage Console anexado

---

### **2.2 — Configurar CORS**

**Criar arquivo `cors.json`:**
```json
[
  {
    "origin": ["https://monitordespesas.com", "http://localhost:5173", "http://localhost:5000"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
]
```

**Aplicar CORS:**
```bash
gsutil cors set cors.json gs://a-republica-brasileira-aa927.appspot.com
```

**Verificar:**
```bash
gsutil cors get gs://a-republica-brasileira-aa927.appspot.com
```

- [ ] Arquivo `cors.json` criado
- [ ] CORS aplicado
- [ ] Verificação executada (output salvo)

---

### **2.3 — Configurar Permissões do Service Account**

**Roles necessárias:**
- `roles/storage.objectCreator` — Para upload de arquivos
- `roles/storage.objectViewer` — Para leitura (se necessário)

**Via Console:**
1. IAM & Admin → Service Accounts
2. Selecionar service account (firebase-adminsdk-...)
3. Add Role → Storage Object Creator

**Via gcloud:**
```bash
gcloud projects add-iam-policy-binding a-republica-brasileira-aa927 \
  --member="serviceAccount:firebase-adminsdk-fbsvc@a-republica-brasileira-aa927.iam.gserviceaccount.com" \
  --role="roles/storage.objectCreator"
```

- [ ] Permissões concedidas
- [ ] Validado no Console IAM
- [ ] Service account key (`serviceAccountKey.json`) no lugar correto

---

### **2.4 — Configurar Variáveis de Ambiente**

**Sistema ETL (`.env`):**
```bash
cd "Sistema ETL"
cp .env.example .env
nano .env  # ou code .env
```

**Adicionar:**
```env
FIREBASE_STORAGE_BUCKET=a-republica-brasileira-aa927.appspot.com
UPLOAD_TO_STORAGE=true
STORAGE_BASE_PATH=monitordespesas/cache
STORAGE_KEEP_VERSIONS=10
```

**Frontend (`.env`):**
```bash
cd monitordespesas
cp .env.example .env
nano .env  # ou code .env
```

**Adicionar:**
```env
VITE_STORAGE_URL=https://storage.googleapis.com/a-republica-brasileira-aa927.appspot.com/monitordespesas/cache/latest
VITE_USE_REMOTE_STORAGE=false  # true em produção
```

- [ ] `.env` do ETL configurado
- [ ] `.env` do frontend configurado
- [ ] `.env` adicionado ao `.gitignore` (verificar!)

---

## 🧪 Fase 3: Testes e Validação (PENDENTE)

### **3.1 — Testar Configuração do Storage**

```bash
cd "Sistema ETL"
npm run build
npm run test:storage
```

**Esperado:**
```
🧪 TESTE DE UPLOAD PARA FIREBASE STORAGE
=========================================

1️⃣ Validando configuração do Storage...
✅ Configuração validada!

2️⃣ Verificando diretório de caches...
✅ 5 arquivos encontrados:
   - suppliers-cache.json
   - dashboard-cache.json
   - analysis-cache.json
   - deputies-cache.json
   - rankings-cache.json

3️⃣ Iniciando upload de teste...
[logs de upload...]

✅ TESTE CONCLUÍDO COM SUCESSO!
```

- [ ] Comando executado sem erros
- [ ] 5 arquivos enviados com sucesso
- [ ] URLs públicas geradas
- [ ] Logs salvos para referência

---

### **3.2 — Validar Acesso Público**

**Testar no navegador:**
```
https://storage.googleapis.com/a-republica-brasileira-aa927.appspot.com/monitordespesas/cache-test/caches-manifest.json
```

**Testar via curl:**
```bash
curl -I "https://storage.googleapis.com/a-republica-brasileira-aa927.appspot.com/monitordespesas/cache-test/caches-manifest.json"
```

**Esperado:**
```
HTTP/2 200
content-type: application/json
cache-control: public, max-age=3600
...
```

- [ ] Arquivo acessível no navegador
- [ ] Status 200 OK
- [ ] Headers corretos (Cache-Control, Content-Type)
- [ ] CORS funcionando (não há erro de CORS no console do navegador)

---

### **3.3 — Rodar ETL Completo com Upload**

```bash
cd "Sistema ETL"
npm run etl:despesas:pc -- 57 5 --firestore
```

**Verificar logs:**
- [ ] ETL executado com sucesso
- [ ] Caches gerados em `dist/cache_export/`
- [ ] Upload iniciado automaticamente
- [ ] 5 arquivos enviados para Storage
- [ ] Path `monitordespesas/cache/latest/` criado
- [ ] Path `monitordespesas/cache/v2025-10-XX/` criado (versionado)

---

### **3.4 — Testar Frontend com Caches Remotos**

**Development (caches locais):**
```bash
cd monitordespesas
npm run dev
```
- [ ] Frontend carrega
- [ ] Usa caches de `/public/cache/`
- [ ] Logs indicam "Usando caches locais"

**Production (caches remotos):**
```bash
cd monitordespesas
VITE_USE_REMOTE_STORAGE=true npm run build
npm run preview
```
- [ ] Build sem erros
- [ ] Preview carrega
- [ ] Logs indicam "Usando Firebase Storage"
- [ ] Manifest carregado com sucesso
- [ ] Fornecedores carregam corretamente
- [ ] Performance aceitável (latência <2s na primeira carga)

---

## 📊 Fase 4: Monitoramento (PRÓXIMA SPRINT)

### **4.1 — Métricas Básicas**
- [ ] Acessar Firebase Console → Storage
- [ ] Verificar tamanho total usado
- [ ] Verificar número de versões mantidas
- [ ] Anotar data da primeira execução bem-sucedida

### **4.2 — Validação de Integridade**
- [ ] Hash SHA-256 dos arquivos bate com manifest
- [ ] Nenhum arquivo corrompido
- [ ] Cache do frontend atualiza quando há nova versão

### **4.3 — Cleanup**
- [ ] Rodar `npm run storage:cleanup` após 2 semanas
- [ ] Verificar que versões antigas foram removidas
- [ ] Confirmar que últimas 10 foram mantidas

---

## 🚨 Troubleshooting

### **Erro: Bucket não existe**
```
❌ Bucket do Firebase Storage não existe
```
**Solução:** Criar bucket (ver seção 2.1)

---

### **Erro: Permissões negadas (403)**
```
❌ Falha no upload: Forbidden (403)
```
**Solução:**
1. Verificar se service account tem `roles/storage.objectCreator`
2. Verificar path do `serviceAccountKey.json`
3. Verificar se bucket é do projeto correto

---

### **Erro: CORS bloqueado**
```
Access to fetch at '...' has been blocked by CORS policy
```
**Solução:**
1. Aplicar configuração CORS (ver seção 2.2)
2. Verificar se domínio do frontend está na lista de `origin`
3. Limpar cache do navegador

---

### **Frontend não carrega dados**
```
Failed to fetch manifest: NetworkError
```
**Solução:**
1. Verificar variável `VITE_STORAGE_URL` no `.env`
2. Testar URL manualmente no navegador
3. Verificar logs do console (DevTools → Network)
4. Confirmar que `VITE_USE_REMOTE_STORAGE=true`

---

## 📞 Contatos e Referências

| Documento | Descrição |
|-----------|-----------|
| [`FLUXO-DADOS-ETL-FRONTEND.md`](./FLUXO-DADOS-ETL-FRONTEND.md) | Análise técnica completa |
| [`CONFIGURACAO-STORAGE.md`](../etldocs/CONFIGURACAO-STORAGE.md) | Guia detalhado de configuração |
| [`RESUMO-EXECUTIVO-SPRINT-OTIMIZACAO.md`](./RESUMO-EXECUTIVO-SPRINT-OTIMIZACAO.md) | Resumo executivo da sprint |
| [`OPTIMIZATION_ROADMAP.md`](../planning/OPTIMIZATION_ROADMAP.md) | Planejamento completo |

---

**Última atualização:** 1 de outubro de 2025  
**Status:** Aguardando configuração de infraestrutura (Fase 2)
