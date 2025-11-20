import { z } from 'zod';
import { DeputadoBaseSchema } from './deputado.schema';

/**
 * Schema para a interface FornecedorCategoria.
 */
export const FornecedorCategoriaSchema = z.object({
  categoria: z.string(),
  total: z.number(),
  percentual: z.number().optional().nullable(),
});

/**
 * Schema para a interface FornecedorAnoResumo.
 */
export const FornecedorAnoResumoSchema = z.object({
  ano: z.number(),
  total: z.number(),
  numeroTransacoes: z.number().optional().nullable(),
  numeroDeputados: z.number().optional().nullable(),
});

/**
 * Schema para a interface FornecedorResumo.
 * Valida a estrutura de um fornecedor com dados agregados.
 */
export const FornecedorResumoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nome: z.string(),
  cnpjCpf: z.string().nullable(),
  tipoFornecedor: z.string().nullable(),
  tipoDespesaPrincipal: z.string().nullable(),
  totalRecebido: z.number(),
  numeroTransacoes: z.number(),
  numeroDeputados: z.number(),
  scoreSuspeicao: z.number().nullable(),
  ranking: z.number().nullable(),
  categorias: z.array(FornecedorCategoriaSchema),
  anos: z.array(FornecedorAnoResumoSchema),
  createdAt: z.string().nullable().optional(),
  // Usamos `pick` para selecionar apenas os campos necessários do DeputadoResumoSchema
  deputadosAtendidos: z.array(DeputadoBaseSchema.pick({
    id: true,
    nomeEleitoral: true,
    nome: true,
    siglaPartido: true,
    siglaUf: true,
  })).optional(),
});
