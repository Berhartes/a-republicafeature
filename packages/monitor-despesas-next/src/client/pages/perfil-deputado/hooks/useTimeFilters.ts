
import { useState, useEffect, useMemo } from 'react';

export function useTimeFilters(initialAno: number | 'todos' = 2024) {
  const [anoSelecionado, setAnoSelecionado] = useState<number | 'todos'>(initialAno);
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [anosComDados, setAnosComDados] = useState<{ano: number, quantidade: number}[]>([]);

  const anosDisponiveis = useMemo(() => {
    return anosComDados.length > 0 
      ? anosComDados.map(a => a.ano).sort((a, b) => b - a)
      : Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + 1 - i); // Fallback para anos padrão
  }, [anosComDados]);

  const mesesDisponiveis = useMemo(() => [
    { valor: 'todos', nome: 'Ano completo' },
    { valor: '1', nome: 'Janeiro' },
    { valor: '2', nome: 'Fevereiro' },
    { valor: '3', nome: 'Março' },
    { valor: '4', nome: 'Abril' },
    { valor: '5', nome: 'Maio' },
    { valor: '6', nome: 'Junho' },
    { valor: '7', nome: 'Julho' },
    { valor: '8', nome: 'Agosto' },
    { valor: '9', nome: 'Setembro' },
    { valor: '10', nome: 'Outubro' },
    { valor: '11', nome: 'Novembro' },
    { valor: '12', nome: 'Dezembro' },
  ], []);

  useEffect(() => {
    if (anosDisponiveis.length > 0 && !anosDisponiveis.includes(anoSelecionado as number)) {
      const latestYear = Math.max(...anosDisponiveis);
      setAnoSelecionado(latestYear);
    }
  }, [anosDisponiveis, anoSelecionado]);

  return {
    anoSelecionado,
    mesSelecionado,
    setAnoSelecionado,
    setMesSelecionado,
    anosDisponiveis,
    mesesDisponiveis,
    anosComDados,
    setAnosComDados
  };
}
