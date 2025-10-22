import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useConnection } from '@/hooks/useConnection'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ConnectionStatus() {
  const { isOnline, Connected, reconnect } = useConnection()

  if (isOnline && Connected) {
    return null // Não mostrar nada quando está tudo funcionando
  }

  return (
    <Alert className={`fixed top-4 right-4 z-50 w-auto ${
      !isOnline ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
    }`}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="h-4 w-4 text-red-600" />
        ) : (
          <Wifi className="h-4 w-4 text-yellow-600" />
        )}
        
        <AlertDescription className="flex items-center gap-2">
          {!isOnline ? (
            <span className="text-red-800">Sem conexão com a internet</span>
          ) : (
            <span className="text-yellow-800">Reconectando ao banco de dados...</span>
          )}
          
          {isOnline && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={reconnect}
              className="h-6 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}