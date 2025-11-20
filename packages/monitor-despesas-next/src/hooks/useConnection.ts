import { useCallback, useEffect, useState } from 'react'

export function useConnection() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [Connected, setConnected] = useState<boolean>(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const reconnect = useCallback(() => {
    // Simula uma tentativa de reconexão rápida
    setConnected(false)
    setTimeout(() => setConnected(true), 500)
  }, [])

  return { isOnline, Connected, reconnect }
}