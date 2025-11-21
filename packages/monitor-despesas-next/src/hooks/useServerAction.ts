/**
 * Hook moderno para trabalhar com Server Actions usando recursos do React 19
 * 
 * Usa:
 * - useTransition() para tracking de pending state
 * - useOptimistic() para UI otimista
 * - Suporte a error boundaries
 * 
 * @example
 * ```tsx
 * const { execute, isPending, error } = useServerAction(myServerAction)
 * 
 * <button onClick={() => execute(data)} disabled={isPending}>
 *   {isPending ? 'Salvando...' : 'Salvar'}
 * </button>
 * ```
 */

import { useTransition, useState, useCallback } from 'react'

interface UseServerActionOptions<TResult> {
  onSuccess?: (result: TResult) => void
  onError?: (error: Error) => void
}

interface UseServerActionReturn<TArgs extends any[], TResult> {
  execute: (...args: TArgs) => Promise<TResult | undefined>
  isPending: boolean
  error: Error | null
  reset: () => void
}

export function useServerAction<TArgs extends any[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: UseServerActionOptions<TResult>
): UseServerActionReturn<TArgs, TResult> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (...args: TArgs) => {
      setError(null)
      let result: TResult | undefined

      startTransition(async () => {
        try {
          result = await action(...args)
          options?.onSuccess?.(result!)
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Erro desconhecido')
          setError(error)
          options?.onError?.(error)
        }
      })

      return result
    },
    [action, options]
  )

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return {
    execute,
    isPending,
    error,
    reset,
  }
}

/**
 * Hook para usar Server Action com estado otimista (React 19)
 * Atualiza a UI imediatamente antes da resposta do servidor
 * 
 * @example
 * ```tsx
 * const { data, execute, isPending } = useOptimisticServerAction(
 *   items,
 *   addItemAction,
 *   (currentItems, newItem) => [...currentItems, newItem]
 * )
 * 
 * return (
 *   <>
 *     {data.map(item => <Item key={item.id} {...item} />)}
 *     <button onClick={() => execute(newItem)}>Adicionar</button>
 *   </>
 * )
 * ```
 */
// import { useOptimistic } from 'react' // React 19
// 
// export function useOptimisticServerAction<TData, TArgs extends any[], TResult>(
//   initialData: TData,
//   action: (...args: TArgs) => Promise<TResult>,
//   optimisticUpdate: (currentData: TData, ...args: TArgs) => TData
// ) {
//   const [optimisticData, addOptimisticData] = useOptimistic(
//     initialData,
//     optimisticUpdate
//   )
// 
//   const { execute: executeAction, isPending, error } = useServerAction(action)
// 
//   const execute = useCallback(
//     async (...args: TArgs) => {
//       addOptimisticData(...args)
//       return executeAction(...args)
//     },
//     [addOptimisticData, executeAction]
//   )
// 
//   return {
//     data: optimisticData,
//     execute,
//     isPending,
//     error,
//   }
// }
