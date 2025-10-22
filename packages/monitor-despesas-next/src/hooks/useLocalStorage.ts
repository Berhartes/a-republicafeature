import { useState, useEffect, useCallback } from 'react'

interface UseLocalStorageOptions {
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
  syncData?: boolean
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncData = true
  } = options

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        return deserialize(item)
      }
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error)
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, serialize(valueToStore))
      
      if (syncData) {
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, newValue: valueToStore }
        }))
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error)
    }
  }, [key, serialize, storedValue, syncData])

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue)
        
      if (syncData) {
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, newValue: null }
        }))
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue, syncData])

  useEffect(() => {
    if (!syncData) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue))
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}":`, error)
        }
      }
    }

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-storage', handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-storage', handleCustomEvent)
    }
  }, [key, deserialize, syncData])

  return [storedValue, setValue, removeValue]
}

export function useAnalysisHistory() {
  const [history, setHistory, clearHistory] = useLocalStorage<any[]>('analise-historico', [])

  const addAnalysis = useCallback((analysis: any) => {
    setHistory(prev => {
      const newHistory = [
        {
          ...analysis,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        },
        ...prev
      ]
      return newHistory.slice(0, 10)
    })
  }, [setHistory])

  const removeAnalysis = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }, [setHistory])

  return {
    history,
    addAnalysis,
    removeAnalysis,
    clearHistory
  }
}

export function useUserPreferences() {
  const defaultPreferences = {
    theme: 'light',
    notificationsEnabled: true,
    autoSave: true,
    language: 'pt-BR',
    defaultView: 'dashboard',
    compactMode: false
  }

  const [preferences, setPreferences] = useLocalStorage('user-preferences', defaultPreferences)

  const updatePreference = useCallback(<K extends keyof typeof defaultPreferences>(
    key: K,
    value: typeof defaultPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [setPreferences])

  return {
    preferences,
    updatePreference,
    resetPreferences: () => setPreferences(defaultPreferences)
  }
}
