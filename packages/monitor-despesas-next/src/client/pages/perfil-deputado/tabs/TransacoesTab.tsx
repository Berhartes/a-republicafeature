
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Filter, Download, Search, Calendar, Building2, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters.js';

interface TransacoesTabProps {
  despesasDetalhadas: any[];
  categorias: string[];
  fornecedores: string[];
  loading: boolean;
  deputadoNome?: string;
}

export function TransacoesTab({
  despesasDetalhadas,
  categorias,
  fornecedores,
  loading,
  deputadoNome
}: TransacoesTabProps) {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState<'data' | 'valor' | 'fornecedor'>('data');
  const [ordemDecrescente, setOrdemDecrescente] = useState(true);
  
  const itensPorPagina = 50;

  const despesasFiltradas = despesasDetalhadas.filter(despesa => {
    const matchTexto = !filtroTexto || 
      despesa.nomeFornecedor?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      despesa.descricao?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      despesa.tipoDespesa?.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const matchCategoria = !filtroCategoria || despesa.tipoDespesa === filtroCategoria;
    
    const matchFornecedor = !filtroFornecedor || 
      despesa.nomeFornecedor === filtroFornecedor ||
      despesa.nomeFornecedor === filtroFornecedor;
    
    return matchTexto && matchCategoria && matchFornecedor;
  });

  const despesasOrdenadas = [...despesasFiltradas].sort((a, b) => {
    let valueA, valueB;
    
    switch (ordenacao) {
      case 'data':
        valueA = a.dataDocumento?.seconds || a.data?.seconds || 0;
        valueB = b.dataDocumento?.seconds || b.data?.seconds || 0;
        break;
      case 'valor':
        valueA = parseFloat(a.valorLiquido || 0);
        valueB = parseFloat(b.valorLiquido || 0);
        break;
      case 'fornecedor':
        valueA = (a.nomeFornecedor || '').toLowerCase();
        valueB = (b.nomeFornecedor || '').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) return ordemDecrescente ? 1 : -1;
    if (valueA > valueB) return ordemDecrescente ? -1 : 1;
    return 0;
  });

  const totalPaginas = Math.ceil(despesasOrdenadas.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const despesasPaginadas = despesasOrdenadas.slice(inicio, inicio + itensPorPagina);

  const exportarCSV = () => {
    const headers = ['Data', 'Fornecedor', 'Categoria', 'Descrição', 'Valor'];
    const csv = [
      headers.join(','),
      ...despesasFiltradas.map(despesa => [
        formatDate(despesa.dataDocumento || despesa.data),
        `"${despesa.nomeFornecedor || ''}"`,
        `"${despesa.tipoDespesa || ''}"`,
        `"${despesa.descricao || ''}"`,
        despesa.valorLiquido || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes-${deputadoNome || 'deputado'}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando transações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Transações Detalhadas
        </CardTitle>
        <CardDescription>
          Lista completa de despesas com filtros avançados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <Input
              placeholder="Fornecedor, descrição..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              <Filter className="h-4 w-4 inline mr-1" />
              Categoria
            </label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              <Building2 className="h-4 w-4 inline mr-1" />
              Fornecedor
            </label>
            <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os fornecedores</SelectItem>
                {fornecedores.map(fornecedor => (
                  <SelectItem key={fornecedor} value={fornecedor}>
                    {fornecedor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end">
            <Button onClick={exportarCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex gap-2 items-center text-sm">
          <span>Ordenar por:</span>
          <Button
            variant={ordenacao === 'data' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              if (ordenacao === 'data') {
                setOrdemDecrescente(!ordemDecrescente);
              } else {
                setOrdenacao('data');
                setOrdemDecrescente(true);
              }
            }}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Data {ordenacao === 'data' && (ordemDecrescente ? '↓' : '↑')}
          </Button>
          <Button
            variant={ordenacao === 'valor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              if (ordenacao === 'valor') {
                setOrdemDecrescente(!ordemDecrescente);
              } else {
                setOrdenacao('valor');
                setOrdemDecrescente(true);
              }
            }}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Valor {ordenacao === 'valor' && (ordemDecrescente ? '↓' : '↑')}
          </Button>
          <Button
            variant={ordenacao === 'fornecedor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              if (ordenacao === 'fornecedor') {
                setOrdemDecrescente(!ordemDecrescente);
              } else {
                setOrdenacao('fornecedor');
                setOrdemDecrescente(false);
              }
            }}
          >
            <Building2 className="h-4 w-4 mr-1" />
            Fornecedor {ordenacao === 'fornecedor' && (ordemDecrescente ? '↓' : '↑')}
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <span>
            {despesasFiltradas.length} transações encontradas 
            {despesasFiltradas.length !== despesasDetalhadas.length && 
              ` (de ${despesasDetalhadas.length} total)`
            }
          </span>
          <span>
            Total: {formatCurrency(despesasFiltradas.reduce((sum, d) => sum + parseFloat(d.valorLiquido || 0), 0))}
          </span>
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {despesasPaginadas.map((despesa, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-1">
                    <div className="text-sm text-gray-500">Data</div>
                    <div className="font-medium">
                      {formatDate(despesa.dataDocumento || despesa.data)}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Fornecedor</div>
                    <div className="font-medium truncate">
                      {despesa.nomeFornecedor || 'Não informado'}
                    </div>
                    {despesa.cnpjCpfFornecedor && (
                      <div className="text-xs text-gray-400">
                        {despesa.cnpjCpfFornecedor}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <div className="text-sm text-gray-500">Categoria</div>
                    <Badge variant="outline" className="text-xs">
                      {despesa.tipoDespesa || 'Não especificada'}
                    </Badge>
                  </div>
                  <div className="md:col-span-1">
                    <div className="text-sm text-gray-500">Valor</div>
                    <div className="font-bold text-blue-600">
                      {formatCurrency(parseFloat(despesa.valorLiquido || 0))}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    {despesa.descricao && (
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {despesa.descricao}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
              disabled={paginaAtual === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima
            </Button>
          </div>
        )}

        {despesasDetalhadas.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
