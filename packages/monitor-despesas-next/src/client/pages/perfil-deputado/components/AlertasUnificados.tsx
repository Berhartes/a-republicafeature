
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface AlertasUnificadosProps {
  alertas: string[];
}

export function AlertasUnificados({ alertas }: AlertasUnificadosProps) {
  const [alertasAbertos, setAlertasAbertos] = useState(false);

  if (!alertas || alertas.length === 0) return null;

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAlertasAbertos(!alertasAbertos)}
        className="p-1 h-auto text-orange-600 hover:text-orange-700 hover:bg-orange-50"
      >
        <AlertTriangle className={`h-4 w-4 transition-transform duration-200 ${alertasAbertos ? 'rotate-180' : ''}`} />
        <span className="ml-1 text-sm font-medium">
          {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
        </span>
      </Button>
      
      {alertasAbertos && (
        <div className="mt-2 space-y-1 bg-orange-50 p-3 rounded border-l-4 border-orange-400 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm font-medium text-orange-600 mb-2">Alertas Identificados:</p>
          {alertas.map((alerta, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
              <span className="text-orange-700">{alerta}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}