Proposta de Metodologia Unificada
Fase 1: Definição do Contrato de Dados (A Fonte da Verdade)
Análise de Componentes, Não de Páginas: Em vez de pensar "quais dados a página X precisa?", vamos quebrar a UI em componentes. Para cada componente, definimos:

O dado exato que ele renderiza.
Seus estados: carregando, erro, e sucesso (com os dados).
Criação de Tipos Compartilhados: O "contrato" deve ser código, não documentação. O diretório packages/shared no seu monorepo é o local perfeito para isso.

Ação: Para cada entidade de dados (como CategoryRanking), crie uma interface TypeScript em packages/shared/src/types.
Exemplo (packages/shared/src/types/CategoryRanking.ts):
export interface CategoryRanking {
  id: string;
  rank: number;
  categoryName: string; // O campo que faltou e causou o bug
  value: number;
  // outros campos...
}
Tanto o projeto api quanto o monitor-despesas-next devem usar essa interface. Isso garante que qualquer mudança que quebre o contrato será detectada em tempo de compilação.
Fase 2: Implementação da Entrega (O Padrão de Acesso)
Adotar a Arquitetura Next.js: O frontend é Next.js. A forma mais eficiente e moderna de entregar dados é usando os recursos do próprio framework. Seus documentos 07-server-actions-plan.md e 08-migration-guide-indexeddb-to-server-actions.md mostram que o projeto já caminha nessa direção, o que é excelente.

Padrão de Acesso:

Para Server Components: Use Server Actions. A função que busca os dados vive no servidor, é chamada diretamente pelo componente e já retorna os dados tipados (usando a interface do packages/shared). Isso elimina a necessidade de um endpoint de API explícito para muitos casos de uso.
Para Client Components: Use Route Handlers (a evolução das API Routes). Crie endpoints específicos que retornam exatamente o que o componente cliente precisa, também usando os tipos compartilhados.
Backend for Frontend (BFF): Seus Server Actions e Route Handlers se tornam uma camada de Backend for Frontend. A responsabilidade deles é:

Buscar dados de fontes primárias (banco de dados, outras APIs).
Transformar e Mapear os dados para que se encaixem perfeitamente no contrato (a interface TypeScript).
Entregar para o componente.
Fase 3: Validação e Caching (Garantia e Performance)
Validação na Fonte: O script validate-data-structure.js é uma ótima ideia. Ele pode ser expandido para rodar em CI, buscando os dados "reais" de um ambiente de staging e validando-os contra um schema gerado a partir das interfaces TypeScript (usando zod ou ajv, por exemplo).

Caching Inteligente: A documentação GUIA_COMPLETO_CACHES.md é crucial. A estratégia de caching deve ser definida no mesmo local onde os dados são buscados (nos Server Actions ou Route Handlers), usando as primitivas do Next.js (cache, revalidateTag).

Workflow Sugerido para Novas Features
Kick-off: Desenvolvedor Frontend e Backend se reúnem.
Desenho do Componente: O dev FE desenha o componente e lista os dados necessários.
Definição do Contrato: Juntos, eles criam ou atualizam a interface TypeScript em packages/shared.
Implementação do Backend: O dev BE cria o Server Action ou Route Handler, busca os dados brutos e os transforma para bater exatamente com a interface do contrato.
Implementação do Frontend: O dev FE importa o tipo do shared e chama a função/endpoint, com total confiança na estrutura que receberá.
Adotar essa metodologia tornará o desenvolvimento mais rápido, reduzirá drasticamente bugs como o que você mencionou e criará um sistema mais limpo, previsível e performático. ++C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\02-data-pipeline\07-bug-category-rankings-missing-names.md ++ C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\02-data-pipeline\00-overview\FLUXO_COMPLETO_MATERIALIZE_TO_FRONTEND.md  