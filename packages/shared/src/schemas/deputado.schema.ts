import { z } from 'zod';

/**
 * Schema para a interface DeputadoBase.
 * Valida a estrutura fundamental de um deputado.
 */
export const DeputadoBaseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nomeEleitoral: z.string(),
  nome: z.string().optional(),
  siglaPartido: z.string(),
  siglaUf: z.string(),
  email: z.string().email().nullable().optional(),
  urlFoto: z.string().url().nullable().optional(),
  uri: z.string().url().nullable().optional(),
  legislatura: z.number().nullable().optional(),
});

/**
 * Schema para a interface DeputadoResumo.
 * Estende o DeputadoBaseSchema com informações agregadas de despesas.
 */
export const DeputadoResumoSchema = DeputadoBaseSchema.extend({
  totalDespesas: z.number(),
  numeroDespesas: z.number(),
  fornecedoresIdentificados: z.number().optional(),
});

/**
 * Schema para a interface DespesaDetalhada.
 * Valida a estrutura de uma única transação de despesa.
 */
export const DespesaDetalhadaSchema = z.object({
  ano: z.number(),
  mes: z.number(),
  tipoDespesa: z.string(),
  valorDocumento: z.number().nullable(),
  valorLiquido: z.number().nullable(),
  nomeFornecedor: z.string(),
  cnpjCpfFornecedor: z.string().nullable().optional(),
  dataDocumento: z.string().nullable().optional(),
  numDocumento: z.string().nullable().optional(),
  urlDocumento: z.string().url().nullable().optional(),
  valorGlosa: z.number().nullable().optional(),
  numRessarcimento: z.string().nullable().optional(),
  codDocumento: z.number().nullable().optional(),
  tipoDocumento: z.string().nullable().optional(),
  codTipoDocumento: z.number().nullable().optional(),
  codLote: z.number().nullable().optional(),
  parcela: z.number().nullable().optional(),
});

/**
 * Schema para a interface DeputadoDetalhado.
 * Valida a estrutura completa dos dados detalhados de um deputado,
 * incluindo metadados e uma lista de despesas.
 */
export const DeputadoDetalhadoSchema = z.object({
  metadata: z.object({
    legislador: z.object({
      id: z.number(),
      nome: z.string(),
      nomeEleitoral: z.string().optional(),
      uri: z.string().url().optional(),
      urlFoto: z.string().url().optional(),
      email: z.string().email().optional(),
      siglaPartido: z.string().optional(),
      siglaUf: z.string().optional(),
      totalDespesas: z.number().optional(),
      numeroDespesas: z.number().optional(),
      legislatura: z.number().optional(),
    }),
    generatedAt: z.string(),
    legisladorDetalhes: z.record(z.unknown()).optional(),
  }),
  anos: z.array(z.number()),
  despesas: z.array(DespesaDetalhadaSchema),
});
