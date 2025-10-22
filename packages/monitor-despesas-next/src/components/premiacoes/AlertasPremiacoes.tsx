
import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface AlertasPremiacoesProps {
  erro: string | null
  sucesso: string | null
}

export function AlertasPremiacoes({ erro, sucesso }: AlertasPremiacoesProps) {
  if (!erro && !sucesso) return null

  return (
    <div className="space-y-4">
      {/* Alerta de Erro */}
      {erro && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Erro:</strong> {erro}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Alerta de Sucesso */}
      {sucesso && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Sucesso:</strong> {sucesso}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default AlertasPremiacoes