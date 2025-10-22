# 🚀 CI/CD & DevOps Guide

## Visão Geral

Este documento descreve a implementação completa de CI/CD e DevOps para o Sistema ETL, incluindo pipelines automatizados, testes, segurança e monitoramento.

## 🔧 Estrutura de CI/CD

### GitHub Actions Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push, Pull Request, Schedule diário
- **Jobs**:
  - `lint-and-test`: ESLint + Testes + Cobertura
  - `build`: Build e verificação de artefatos
  - `connectivity-tests`: Testes de conectividade
  - `security-scan`: Auditoria de segurança
  - `performance-check`: Análise de performance

#### 2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
- **Triggers**: Push para main, Tags, Workflow manual
- **Environments**: Staging → Production
- **Features**: Health checks, Rollback automático

#### 3. **Security Pipeline** (`.github/workflows/security.yml`)
- **Scans diários** às 3h UTC
- **Ferramentas**: CodeQL, Trivy, TruffleHog, npm audit
- **Reports**: SARIF upload para GitHub Security

#### 4. **Coverage Pipeline** (`.github/workflows/coverage.yml`)
- **Cobertura mínima**: 80%
- **Integração**: Codecov
- **Reports**: PR comments automáticos

#### 5. **Monitoring Pipeline** (`.github/workflows/monitoring.yml`)
- **Health checks** a cada 6 horas
- **Métricas**: Build time, Bundle size, Memory usage
- **Alertas**: Issues automáticos em falhas

## 🧪 Testes Automatizados

### Estrutura de Testes
```
tests/
├── unit/                     # Testes unitários
│   ├── services/
│   │   ├── premiacao/       # Sistema de premiações
│   │   └── fornecedores/    # Sistema de fornecedores
│   └── utils/
│       └── cache/           # Cache inteligente
├── integration/             # Testes de integração
└── setup.ts                # Configuração Jest
```

### Cobertura de Testes
- **Target**: 80% mínimo
- **Atual**: 85%+ (premiação, fornecedores, cache)
- **Framework**: Jest + TypeScript
- **Reports**: HTML, LCOV, JSON

### Comandos de Teste
```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes de conectividade
npm run test:connectivity
npm run test:firebase
npm run test:dns
```

## 🛡️ Segurança e Qualidade

### Security Scanning
- **npm audit**: Vulnerabilidades de dependências
- **CodeQL**: Análise estática de código
- **Trivy**: Scanner de vulnerabilidades
- **TruffleHog**: Detecção de secrets
- **License check**: Compliance de licenças

### Quality Gates
- **ESLint**: Zero warnings policy
- **Prettier**: Formatação automática
- **TypeScript**: Strict mode
- **Pre-commit hooks**: Lint-staged + Husky

### Dependências
- **Dependabot**: Updates automáticos semanais
- **Security updates**: Alta prioridade
- **Major versions**: Review manual

## 📊 Monitoramento e Alertas

### Métricas Coletadas
- **Build Performance**: Tempo de compilação
- **Bundle Size**: Tamanho dos artifacts
- **Memory Usage**: Uso de memória
- **API Connectivity**: Status das APIs externas
- **Test Coverage**: Cobertura de testes

### Alertas Automáticos
- **Build failures**: Issues no GitHub
- **Security vulnerabilities**: GitHub Security tab
- **Coverage drops**: PR comments
- **Performance degradation**: Workflow summaries

### Health Checks
- **Frequência**: A cada 6 horas
- **Endpoints**: APIs da Câmara, DNS, conectividade geral
- **Timeout**: 5 minutos
- **Fallback**: Continua em caso de falha

## 🚀 Deployment

### Ambientes
1. **Staging**: Auto-deploy em push para main
2. **Production**: Manual trigger ou tags

### Processo de Deploy
1. **Build & Test**: Validação completa
2. **Staging Deploy**: Deploy automático
3. **Health Check**: Verificação pós-deploy
4. **Production Deploy**: Aprovação manual
5. **Rollback**: Automático em falha

### Artefatos
- **Retention**: 30 dias (production), 7 dias (staging)
- **Contents**: dist/, package.json, package-lock.json
- **Naming**: `build-artifacts-{sha}`

## 📈 Métricas de Performance

### Build Performance
- **Target**: < 2 minutos
- **Atual**: ~45 segundos (otimizado)
- **Monitoring**: Alertas se > 3 minutos

### Bundle Analysis
- **Size threshold**: 50MB warning
- **File count tracking**: Monitoramento de crescimento
- **Optimization**: Tree shaking ativo

### Test Performance
- **Target**: < 30 segundos
- **Parallel execution**: Multi-core usage
- **Caching**: node_modules e build cache

## 🔧 Configuração Local

### Pre-commit Setup
```bash
# Instalar husky (se não estiver instalado)
npm run prepare

# Hooks automáticos
git commit # Executará lint-staged automaticamente
```

### Scripts de Qualidade
```bash
# Linting
npm run lint          # Verificar
npm run lint:fix      # Corrigir automaticamente

# Formatação
npm run format        # Aplicar formatação
npm run format:check  # Verificar formatação

# Type checking
npm run type-check    # Verificação TypeScript
```

## 🐛 Troubleshooting

### Build Failures
1. Verificar logs do GitHub Actions
2. Executar `npm run build` localmente
3. Verificar dependências com `npm audit`

### Test Failures
1. Executar `npm test` localmente
2. Verificar mock configurations
3. Validar environment variables

### Security Alerts
1. Verificar GitHub Security tab
2. Executar `npm audit` localmente
3. Aplicar updates com `npm update`

### Coverage Issues
1. Executar `npm run test:coverage`
2. Verificar HTML report em `coverage/`
3. Adicionar testes para arquivos não cobertos

## 📋 Checklist de Manutenção

### Semanal
- [ ] Revisar Dependabot PRs
- [ ] Verificar security alerts
- [ ] Analisar performance metrics

### Mensal
- [ ] Atualizar documentação
- [ ] Revisar quality gates
- [ ] Otimizar workflows se necessário

### Trimestral
- [ ] Auditoria completa de segurança
- [ ] Review de dependency policies
- [ ] Atualização de ferramentas CI/CD

## 🎯 Próximos Passos

1. **Microservices CI/CD**: Pipelines para arquitetura distribuída
2. **Advanced Monitoring**: APM integration (New Relic, DataDog)
3. **Multi-environment**: Dev, Staging, Production workflows
4. **Infrastructure as Code**: Terraform para deploy automation
5. **Feature Flags**: Deployment strategies avançadas