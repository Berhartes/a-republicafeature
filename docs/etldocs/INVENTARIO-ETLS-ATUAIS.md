Plano detalhado
1. Inventário das ETLs atuais
Mapear cada função ETL em a-republica-brasileira.
Registrar endpoints consultados, parâmetros aceitos, formato/volume da saída e artefatos gerados (arquivos, coleções, logs).
2. Engenharia reversa de etl:despesas
Ler a implementação no projeto “sistema ETL”.
Documentar assinatura da função, ciclo de vida (pré-processamento, extração, transformação, carga), padrão de logging, estrutura de erros e convenções de salvamento local.
3. Template padronizado no “sistema ETL”
Criar um módulo reutilizável que encapsule a estrutura de etl:despesas.
Garantir mesma assinatura, utilitários e formato de retorno; expor pontos de extensão claros para lógica específica de cada domínio.
4. Reimplementação das ETLs
Para cada ETL inventariada, criar uma função no “sistema ETL” baseada no template.
Inserir apenas a lógica de negócio (extração/transformação) necessária para obter os mesmos dados e gerar os mesmos artefatos.
5. Ajustes de dependências e persistência
Revisar mapeadores, DTOs, conversores e caminhos de saída para preservar compatibilidade.
Padronizar logs e salvamento local conforme o fluxo de despesas.
6. Atualização dos scripts de execução
Alinhar scripts npm/ts-node do “sistema ETL” para chamar as novas funções.
Garantir que interface e parâmetros de execução sejam idênticos aos de etl:despesas.
7. Testes comparativos
Executar cada nova ETL e comparar os resultados com a versão original (diferença de dados e performance).
Validar estrutura de diretórios, tamanho de arquivos e mensagens de log.
8. Documentação final
Registrar o template, o mapeamento entre ETLs antigas e novas e instruções de uso/manutenção.
Atualizar guias ou READMEs pertinentes para orientar futuras implementações.


# Inventário de ETLs existentes (`a-republica-brasileira`)

Este inventário consolida os fluxos ETL já implementados no repositório `a-republica-brasileira`. Ele mapeia o comando/initiator, a classe `processor` responsável, os principais endpoints consultados e o destino de persistência (PC local e/ou Firestore). O objetivo é servir como referência para replicar a mesma cobertura dentro do projeto “Sistema ETL”, adotando a arquitetura padronizada de `etl:despesas`.

## Câmara dos Deputados

| Comando / script (initiator) | Processor (arquivo) | Escopo dos dados | Endpoints principais | Saída atual (PC / Firestore) |
| --- | --- | --- | --- | --- |
| `npm run camara:grupos`<br>`src/core/functions/camara_api_wrapper/scripts/initiators/processar_grupos_v2.ts` | `GruposProcessor`<br>`scripts/processors/grupos.processor.ts` | Grupos parlamentares, detalhes, histórico e membros. | `GRUPOS.LISTA`, `GRUPOS.DETALHES`, `GRUPOS.HISTORICO`, `GRUPOS.MEMBROS`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/legislatura/semlegislatura/grupos/<id>.json` + `informacoes.json`.<br>**Firestore:** `congressoNacional/camaraDeputados/legislatura/semlegislatura/grupos/*`. |
| `npm run camara:partidos`<br>`.../processar_partidos_v2.ts` | `PartidosProcessor`<br>`.../processors/partidos.processor.ts` | Partidos políticos, detalhes, líderes e membros. | `PARTIDOS.LISTA`, `PARTIDOS.DETALHES`, `PARTIDOS.LIDERES`, `PARTIDOS.MEMBROS`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/partidos/<id>.json` + `legislaturas/<legislatura>/partidos/todos.json` e `metadata_legislatura_<legislatura>.json`.<br>**Firestore:** `congressoNacional/camaraDeputados/legislatura/<legislatura>/partidos/*` + `.../informacoes`. |
| `ts-node .../processar_perfildeputados_v2.ts` | `PerfilDeputadosProcessor`<br>`.../processors/perfil-deputados.processor.ts` | Perfis completos de deputados: dados básicos, órgãos, frentes, ocupações, mandatos externos, histórico e profissões. | `DEPUTADOS.LISTA`, `DEPUTADOS.PERFIL`, `DEPUTADOS.ORGAOS`, `DEPUTADOS.FRENTES`, `DEPUTADOS.OCUPACOES`, `DEPUTADOS.MANDATOS_EXTERNOS`, `DEPUTADOS.HISTORICO`, `DEPUTADOS.PROFISSOES`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/perfil/<id>.json` + `legislatura/<legislatura>/deputados/<id>.json` e `metadata_legislatura_<legislatura>.json`.<br>**Firestore:** `congressoNacional/camaraDeputados/perfil/<id>` + `.../legislatura/<legislatura>/deputados/<id>` e metadados associados. |
| `ts-node .../processar_despesasdeputados_v2.ts` | `DespesasDeputadosProcessor`<br>`.../processors/despesas-deputados.processor.ts` | Despesas de deputados (modo completo ou incremental), agrupadas por ano/mês e com estatísticas. | `DEPUTADOS.LISTA`, `DEPUTADOS.PERFIL`, `DEPUTADOS.DESPESAS`. | **PC:** `BancoDadosLocal/congressoNacional/camaraDeputados/perfilComplementar/despesas/<deputado>/ano/<ano>/mes/<mes>/all_despesas.json` + `estatisticasAgregadas/dados.json` e metadados da legislatura.<br>**Firestore:** `congressoNacional/camaraDeputados/perfilComplementar/despesas/<deputado>/ano/<ano>/mes/<mes>` + `estatisticasAgregadas` e `metadata/legislatura_<legislatura>`. |
| `ts-node .../processar_despesasdeputados_v3.ts` | `DespesasDeputadosV3Processor`<br>`.../processors/despesas-deputados-v3.processor.ts` | Despesas otimizadas para nova estrutura (deputados, fornecedores e despesas em coleções separadas). | `DEPUTADOS.LISTA`, `DEPUTADOS.PERFIL`, `DEPUTADOS.DESPESAS`. | **PC:** não salva (pipeline direto).<br>**Firestore:** `deputados/<id>` (merge), `fornecedores/<cnpj>`, `deputados/<id>/despesas/<uuid>`. |
| `ts-node .../processar_discursosdeputados_v2.ts` | `DiscursosDeputadosProcessor`<br>`.../processors/discursos-deputados.processor.ts` | Discursos por deputado, com consolidação anual e estatísticas. | `DEPUTADOS.LISTA`, `DEPUTADOS.PERFIL`, `DEPUTADOS.DISCURSOS`. | **PC:** `BancoDadosLocal/congressoNacional/camaraDeputados/perfilComplementar/<deputado>/discursos/<ano>.json` + `stats.json` e metadados gerais por legislatura.<br>**Firestore:** `congressoNacional/camaraDeputados/perfilComplementar/<deputado>/discursos/<ano>` + `stats` e `estatisticasGerais/discursos/legislatura_<legislatura>`. |
| `ts-node .../processar_eventosdeputados_v2.ts` | `EventosDeputadosProcessor`<br>`.../processors/eventos-deputados.processor.ts` | Eventos (agenda) relacionados a deputados, com merge incremental e estatísticas. | `DEPUTADOS.LISTA`, `DEPUTADOS.PERFIL`, `DEPUTADOS.EVENTOS`. | **PC:** `BancoDadosLocal/congressoNacional/camaraDeputados/perfilComplementar/<deputado>/eventos/<ano>.json` + `stats.json` e metadados por legislatura.<br>**Firestore:** `congressoNacional/camaraDeputados/perfilComplementar/<deputado>/eventos/<ano>` + `stats` e `estatisticasGerais/eventos/legislatura_<legislatura>`. |
| `ts-node .../processar_frentes_v2.ts` | `FrentesProcessor`<br>`.../processors/frentes.processor.ts` | Frentes parlamentares, detalhes e membros por legislatura. | Endpoints diretos `/frentes`, `/frentes/{id}`, `/frentes/{id}/membros`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/frentes/legislaturas/<legislatura>/*.json` + `metadata/geral.json`.<br>**Firestore:** `congressoNacional/camaraDeputados/legislatura/<legislatura>/frentes/<id>` + `metadata/frentes`. |
| `ts-node .../processar_blocos_v2.ts` | `BlocosProcessor`<br>`.../processors/blocos.processor.ts` | Blocos parlamentares, partidos associados e membros por partido. | `BLOCOS.LISTA`, `BLOCOS.DETALHES`, `/blocos/{id}/partidos`, `/partidos/{id}/membros`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/blocos/legislaturas/<legislatura>/<id>.json` + `metadata/geral.json`.<br>**Firestore:** `congressoNacional/camaraDeputados/legislatura/<legislatura>/blocos/<id>` + `.../metadata`. |
| `ts-node .../processar_orgaos_v2.ts` | `OrgaosProcessor`<br>`.../processors/orgaos.processor.ts` | Órgãos da Câmara, detalhes, eventos, membros e votações. | `ORGAOS.LISTA`, `ORGAOS.DETALHES`, `ORGAOS.EVENTOS`, `ORGAOS.MEMBROS`, `ORGAOS.VOTACOES`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/orgaos/legislaturas/<legislatura>/<orgao>.json` + metadados gerais.<br>**Firestore:** `congressoNacional/camaraDeputados/legislatura/<legislatura>/orgaos/<id>` + `orgaos_metadata/geral`. |
| `ts-node .../processar_legislatura_v2.ts` | `LegislaturasProcessor`<br>`.../processors/legislaturas.processor.ts` | Legislaturas, detalhes, lideranças e membros da mesa. | `LEGISLATURAS.LISTA`, `LEGISLATURAS.DETALHES`, `LEGISLATURAS.LIDERES`, `LEGISLATURAS.MESA`. | **PC:** `bancoDados_local/congressoNacional/camaraDeputados/legislaturas/<id>.json` + `metadata_geral.json`.<br>**Firestore:** `congressoNacional/camaraDeputados/legislatura/<id>` (documentos individuais) + metadados consolidados. |

## Senado Federal

| Comando / script (initiator) | Módulo responsável | Escopo dos dados | Endpoints / fontes | Saída atual |
| --- | --- | --- | --- | --- |
| `npm run senado:perfil`<br>`src/core/functions/senado_api_wrapper/scripts/initiators/processar_perfilsenadores.ts` | `PerfilSenadoresProcessor`<br>`scripts/processors/perfil-senadores.processor.ts` (usa `perfilSenadoresExtractor`, `perfilSenadoresTransformer`, `perfilSenadoresLoader`) | Perfis completos de senadores (dados básicos, mandatos, cargos, comissões, filiações, histórico acadêmico, licenças, profissões, lideranças). | Endpoints do Senado: `SENADORES.LISTA_LEGISLATURA`, `SENADORES.DADOS_BASICOS`, `SENADORES.MANDATOS`, `SENADORES.CARGOS`, `SENADORES.COMISSOES`, `SENADORES.FILIACOES`, `SENADORES.HISTORICO_ACADEMICO`, `SENADORES.LICENCAS`, `SENADORES.PROFISSOES`, `SENADORES.LIDERANCAS`. | **PC:** arquivos em `senadores/legislatura_<legislatura>/` (lista, perfis completos e individuais).<br>**Firestore:** coleções e subcoleções gerenciadas por `perfilSenadoresLoader` (`senado/legislaturas/<legislatura>/...`). |
| `npm run senado:discursos`<br>`scripts/initiators/01/processar_senadodiscursos.ts` | `DiscursosProcessor`<br>`scripts/processors/discursos.processor.ts` (com `discursosLoader`) | Discursos de senadores por período, com estatísticas por tipo e mês. | Extratores de `perfilSenadoresExtractor` (`extractDiscursosDetalhados`) + endpoints de discursos do Senado. | **PC:** arquivos em `senadores/legislatura_<legislatura>/discursos/` com listas e estatísticas.<br>**Firestore:** via `discursosLoader.saveMultiplosDiscursos` em estruturas `senado/legislaturas/<legislatura>/discursos`. |
| `npm run senado:blocos`<br>`scripts/initiators/processar_senadoblocos.ts` | `BlocosProcessor`<br>`scripts/processors/blocos.processor.ts` | Blocos parlamentares do Senado, integrantes e metadados. | Endpoints do Senado para blocos (`BLOCOS.LISTA`, detalhes e membros) consumidos via `senado_api_wrapper/utils/api`. | **PC:** exportações em `senado/blocos/legislatura_<legislatura>/...` (via utilitários de export).<br>**Firestore:** carregamento via `blocos.loader` (coleções `senado/blocos/<legislatura>/...`). |
| `npm run senado:comissoes`<br>`scripts/initiators/02/0processar_comissoes.ts` | Pipeline manual (`comissaoExtractor` → `comissoesTransformer` → `comissaoLoader`) | Comissões do Senado, detalhes, composição e histórico. | Endpoints de comissões (`/comissao/lista`, `/comissao/{id}`, etc.) empregados pelo extrator. | **PC:** não persiste localmente por padrão.<br>**Firestore:** `comissaoLoader` salva coleções `senado/comissoes/<legislatura>/...` e histórico. |
| `npm run senado:liderancas`<br>`scripts/initiators/02/0processar_liderancas.ts` | `liderancaExtractor` / `liderancasTransformer` / `liderancaLoader` | Lideranças partidárias do Senado. | Endpoints específicos de lideranças (`/lideranca/...`). | **PC:** não implementado.<br>**Firestore:** coleções `senado/liderancas/<legislatura>/...`. |
| `npm run senado:votacoes`<br>`scripts/initiators/02/0processar_votacoes.ts` | `votacaoExtractor` / `votacoesTransformer` / `votacaoLoader` | Votações nominais do Senado e metadados associados. | Endpoints de votações (`/votacao/lista`, `/votacao/{id}` etc.). | **PC:** não implementado.<br>**Firestore:** coleções `senado/votacoes/<legislatura>/...`. |

> **Observações gerais**
>
> * Muitos scripts da Câmara aceitam opções CLI (`--pc`, `--firestore`, `--limite`, `--concorrencia`, `--atualizar`, filtros por partido/UF etc.) gerenciadas por `ETLCommandParser`.
> * A convenção de salvamento local da Câmara utiliza raiz `bancoDados_local` dentro do diretório configurado por `getPCSaveDirectory()`, espelhando a mesma hierarquia usada no Firestore.
> * Os pipelines do Senado já seguem a divisão modular (extrator → transformador → loader), mas nem todos oferecem saída local; padronizar isso faz parte da refatoração.
> * A versão `despesas v3` escreve diretamente em coleções normalizadas (`deputados`, `fornecedores`, `despesas`) e não possui modo PC — importante decidir se será incorporada ao template unificado ou mantida como fluxo especializado.
