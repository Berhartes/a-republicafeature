export interface CategoryRanking {
  deputadoId: string; // Added to identify the deputy
  categoryName: string;
  value: number; // Corresponds to gastoDeputado
  rank: number; // Corresponds to posicao
  mediaCategoria: number;
  totalCategoria?: number;
}