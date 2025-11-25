# Estrutura do Projeto e Componentização

Este projeto foi reorganizado para seguir uma arquitetura baseada em **Features (Assuntos)** e **Componentes Autosuficientes**.

## Organização por Assuntos (Features)

Em vez de agrupar arquivos por tipo (ex: `components`, `utils`, `hooks`), agrupamos por **Funcionalidade**.
Tudo relacionado a uma funcionalidade específica fica dentro de sua pasta em `src/app/gastos/(features)/[nome-da-feature]`.

Exemplo:
- `(features)/ranking/`: Contém a página, componentes e lógica do Ranking.
- `(features)/busca/`: Contém o componente de busca global.

### Componentes Compartilhados
Componentes genéricos de UI (botões, cards, inputs) ficam em `src/app/gastos/ui`.
Gráficos base ficam em `src/app/gastos/ui/charts`.

## Page vs Page Client

No Next.js (App Router), temos dois tipos principais de componentes:

### 1. Server Components (`page.tsx`)
- **Onde roda:** No Servidor.
- **O que faz:** Busca dados (banco de dados, APIs), define metadados (SEO).
- **O que NÃO pode fazer:** Usar `useState`, `useEffect`, `onClick`, `window`, `document`.
- **Padrão:** Todo arquivo `page.tsx` é um Server Component por padrão.

### 2. Client Components (`page.client.tsx` ou qualquer arquivo com `'use client'`)
- **Onde roda:** No Navegador (e pré-renderizado no servidor).
- **O que faz:** Interatividade (botões, formulários, abas), gerencia estado (`useState`).
- **Como usar:** Adicione `'use client'` na primeira linha do arquivo.
- **Dica:** Mantenha os Client Components nas "pontas" da árvore de componentes (folhas), deixando o máximo possível de lógica no servidor.

## Componentes Autosuficientes

Cada componente deve ser capaz de funcionar de forma independente.
- **Estilos:** Usamos Tailwind CSS, então os estilos estão nas classes.
- **Tipos:** Se o componente precisa de tipos específicos, defina-os no próprio arquivo ou em um arquivo `types.ts` ao lado dele.
- **Dependências:** Evite dependências circulares. Importe o que precisar.

## Arquivos Removidos
Arquivos de teste (`playwright`, `vitest`) e pastas obsoletas foram removidos para limpar o projeto.
