## Diagnóstico
- O erro indica um problema de HMR/Turbopack: "module factory is not available... It might have been deleted in an HMR update". O arquivo citado é `src/app/error.tsx` (client component), mas o problema é típico de processo dev antigo + cache inválido.
- Observação: já houve tentativas de subir o dev server e o lock de `.next/dev/lock` impediu; há alta chance de um servidor Next antigo rodar em `:3000` com cache corrompido.

## Plano de Ação
1. Encerrar servidores antigos e limpar cache
- Finalizar quaisquer processos Next em `:3000/:3001`.
- Excluir a pasta `.next` em `packages/monitor-despesas-next` para eliminar HMR state antigo.

2. Subir dev com fallback
- Iniciar com `npm run dev` (Turbopack). Se o erro voltar, usar `npm run dev:webpack` (desativa Turbopack) para estabilizar.
- Abrir a porta correta (provável `http://localhost:3001` se `:3000` continuar ocupado).

3. Verificações rápidas
- Hard reload (Ctrl+F5) após reiniciar o dev.
- Verificar `/monitor/fornecedores` com:
  - Dropdown de categoria no Top 5 ativo e filtrando.
  - Botão “Ver gráfico pizza” na seção de distribuição funcionando e alternando corretamente.

4. Plano B (se persistir)
- Remover o `use client` de `src/app/error.tsx` temporariamente (transforma em server component com JSX simples sem hooks) e testar.
- Voltar ao estado original após estabilização; o erro normalmente não é do componente e sim do HMR.

## Entregáveis
- Ambiente dev reiniciado sem HMR error.
- Página `/monitor/fornecedores` funcional com filtro de categoria (dropdown) e alternância de gráfico pizza.

Confirma que posso executar o plano (parar processo, limpar `.next`, reiniciar dev e validar)?