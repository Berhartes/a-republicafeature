import { useState } from 'react';
import { useGlobalData } from '@/contexts/GlobalDataContext';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DeputadoSearchProps {
  deputados?: any[];
  selectedDeputados?: any[];
  onSelectDeputado?: (deputado: any) => void;
  onRemoveDeputado?: (deputadoId: string | number) => void;
  placeholder?: string;
}

export function DeputadoSearch({ deputados, selectedDeputados = [], onSelectDeputado, onRemoveDeputado: _onRemoveDeputado, placeholder = "Buscar deputado..." }: DeputadoSearchProps) {
  const { state, dispatch } = useGlobalData();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const handleSelectDeputado = (deputado: any) => {
    onSelectDeputado?.(deputado);
    setSearchTerm('');
    dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {searchTerm && (deputados || state.filteredDeputados).length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {(deputados || state.filteredDeputados).filter(d => d.nomeEleitoral.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10).map((deputado, index) => (
            <button
              key={index}
              onClick={() => handleSelectDeputado(deputado)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              disabled={selectedDeputados.some(d => d.id === deputado.id)}
            >
              <div className="font-medium">{deputado.nomeEleitoral}</div>
              <div className="text-sm text-gray-500">{deputado.siglaPartido} - {deputado.siglaUf || deputado.siglaUf}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}