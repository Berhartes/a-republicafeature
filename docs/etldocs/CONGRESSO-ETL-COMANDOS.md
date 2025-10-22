# 📚 Guia de Comandos ETL — Congresso Nacional

Este guia resume os comandos padronizados para executar as ETLs da Câmara dos Deputados e do Senado Federal dentro do hub unificado do Congresso Nacional.

## 🔗 Hub Central
- Importações compartilhadas podem ser feitas via `@/core/congresso_nacional`.
- Os namespaces disponíveis são `Camara` e `Senado`, contendo os mesmos utilitários, processadores e iniciadores expostos pelos wrappers originais.

## 🏛️ Câmara dos Deputados
| Comando | Descrição |
|---------|-----------|
| `npm run etl:despesas:pc -- <legislatura> [limite]` | Único comando para despesas de deputados com saída local padrão. |
| `npm run camara:blocos:pc -- <legislatura> [opções]` | Processa blocos partidários. |
| `npm run camara:discursos:pc -- <legislatura> [opções]` | Processa discursos registrados. |
| `npm run camara:eventos:pc -- <legislatura> [opções]` | Processa eventos oficiais. |
| `npm run camara:frentes:pc -- <legislatura> [opções]` | Processa frentes parlamentares. |
| `npm run camara:grupos:pc -- <legislatura> [opções]` | Processa grupos de trabalho e comissões. |
| `npm run camara:legislaturas:pc -- <legislatura> [opções]` | Processa dados da legislatura informada. |
| `npm run camara:orgaos:pc -- <legislatura> [opções]` | Processa órgãos da Câmara. |
| `npm run camara:partidos:pc -- <legislatura> [opções]` | Processa informações de partidos. |
| `npm run camara:perfis:pc -- <legislatura> [opções]` | Processa perfis detalhados dos deputados. |

## 🏛️ Senado Federal
| Comando | Descrição |
|---------|-----------|
| `npm run senado:perfis:pc -- <legislatura> [opções]` | Processa perfis de senadores. |
| `npm run senado:mesas:pc -- <legislatura> [opções]` | Processa composição das mesas diretoras. |
| `npm run senado:blocos:pc -- <legislatura> [opções]` | Processa blocos partidários. |
| `npm run senado:comissoes:pc -- <legislatura> [opções]` | Processa comissões e membros. |
| `npm run senado:liderancas:pc -- <legislatura> [opções]` | Processa lideranças partidárias. |
| `npm run senado:votacoes:pc -- <legislatura> [opções]` | Processa votações com detalhamento por parlamentar. |

## 💡 Boas Práticas
- O salvamento local (PC) já é aplicado automaticamente; use `--pc` apenas para explicitar ou combinar com outros destinos.
- Utilize `--firestore` para direcionar o carregamento ao Firestore (executa em conjunto com o modo PC).
- Combine com flags específicas de cada CLI (`--ano`, `--mes`, `--limite`, etc.) conforme disponível nos iniciadores.

## ✅ Compatibilidade
Os comandos históricos `etl:*` permanecem disponíveis para garantir compatibilidade com pipelines legados, mas novos desenvolvimentos devem adotar os prefixos `camara:` e `senado:` seguidos de `:pc` para refletir a visão unificada do Congresso Nacional e garantir a criação automática do banco de dados local.
