// Simple CategoryRegistry stub for fallback provider

export interface CategoryDefinition {
  id: number | string;
  displayName: string;
}

class CategoryRegistry {
  private categories: CategoryDefinition[] = [
    { id: 1, displayName: 'Categoria Exemplo 1' },
    { id: 2, displayName: 'Categoria Exemplo 2' },
    { id: 'geral', displayName: 'Geral' },
  ];

  getById(id: number | string): CategoryDefinition | undefined {
    return this.categories.find((cat) => cat.id === id);
  }
}

export const categoryRegistry = new CategoryRegistry();


