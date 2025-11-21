"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Status = "idle" | "loading" | "success" | "error"

export interface UseAsyncTabDataOptions<T> {
  tabKey: string
  getData: () => Promise<T>
  ttlMs?: number
  loadOnMount?: boolean
  enabled?: boolean
}

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

function getSessionKey(tabKey: string) {
  return `async-tab:${tabKey}`
}

export function useAsyncTabData<T>(options: UseAsyncTabDataOptions<T>) {
  const { tabKey, getData, ttlMs = 5 * 60_000, loadOnMount = false, enabled = true } = options

  const [status, setStatus] = useState<Status>("idle")
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const loadingRef = useRef(false)

  const readCache = useCallback((): CacheEntry<T> | null => {
    try {
      const raw = sessionStorage.getItem(getSessionKey(tabKey))
      if (!raw) return null
      const parsed = JSON.parse(raw) as CacheEntry<T>
      if (!parsed || typeof parsed.expiresAt !== "number") return null
      if (Date.now() > parsed.expiresAt) return null
      return parsed
    } catch {
      return null
    }
  }, [tabKey])

  const writeCache = useCallback((value: T) => {
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: Date.now() + ttlMs,
    }
    try {
      sessionStorage.setItem(getSessionKey(tabKey), JSON.stringify(entry))
    } catch {
      // ignore quota or serialization errors
    }
  }, [tabKey, ttlMs])

  const invalidate = useCallback(() => {
    try {
      sessionStorage.removeItem(getSessionKey(tabKey))
    } catch {
      // ignore
    }
  }, [tabKey])

  const load = useCallback(async () => {
    if (!enabled || loadingRef.current) return
    loadingRef.current = true
    setStatus("loading")
    setError(null)

    // Try cache first
    const cached = readCache()
    if (cached) {
      setData(cached.data)
      setStatus("success")
      loadingRef.current = false
      return cached.data
    }

    try {
      const value = await getData()
      setData(value)
      setStatus("success")
      writeCache(value)
      return value
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      setStatus("error")
      throw e
    } finally {
      loadingRef.current = false
    }
  }, [enabled, getData, readCache, writeCache])

  const prefetch = useCallback(async () => {
    if (!enabled) return
    const cached = readCache()
    if (cached) return
    try {
      const value = await getData()
      writeCache(value)
    } catch {
      // ignore prefetch errors
    }
  }, [enabled, getData, readCache, writeCache])

  useEffect(() => {
    if (loadOnMount) {
      void load()
    }
     
  }, [])

  const api = useMemo(() => ({
    load,
    prefetch,
    invalidate,
  }), [load, prefetch, invalidate])

  return {
    status,
    data,
    error,
    ...api,
  }
}