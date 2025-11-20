"use client"

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation'

type Validator<T> = (value: T) => boolean | string

type Parser<T> = (raw: string | null) => T

type Serializer<T> = (value: T) => string | null

export type FilterConfig<Schema extends Record<string, any>> = {
  [K in keyof Schema]: {
    parse: Parser<Schema[K]>
    serialize: Serializer<Schema[K]>
    default: Schema[K]
    validate?: Validator<Schema[K]>
  }
}

export type FilterErrors<Schema extends Record<string, any>> = Partial<Record<keyof Schema, string | null>>

export interface UseUrlSyncedFiltersOptions {
  replaceStrategy?: 'push' | 'replace'
}

function normalizeSearchParams(params: ReadonlyURLSearchParams | null): string {
  if (!params) return ''
  const normalized = new URLSearchParams()
  Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([key, value]) => normalized.set(key, value))
  return normalized.toString()
}

export function useUrlSyncedFilters<Schema extends Record<string, any>>(
  config: FilterConfig<Schema>,
  options: UseUrlSyncedFiltersOptions = {},
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const replaceStrategy = options.replaceStrategy ?? 'push'

  const sortedKeys = useMemo(
    () => (Object.keys(config) as (keyof Schema)[]).sort((a, b) => String(a).localeCompare(String(b))),
    [config],
  )

  const parseParams = useCallback(
    (params: ReadonlyURLSearchParams | null): Schema => {
      const result: Partial<Schema> = {}
      for (const key of sortedKeys) {
        const raw = params?.get(String(key)) ?? null
        const parsed = config[key].parse(raw)
        result[key] = parsed ?? config[key].default
      }
      return result as Schema
    },
    [config, sortedKeys],
  )

  const [filters, setFilters] = useState<Schema>(() => parseParams(searchParams))
  const [errors, setErrors] = useState<FilterErrors<Schema>>({})
  const lastSyncedQueryRef = useRef<string>(normalizeSearchParams(searchParams))

  const toQueryString = useCallback(
    (values: Schema): string => {
      const params = new URLSearchParams()
      for (const key of sortedKeys) {
        const serialized = config[key].serialize(values[key])
        if (serialized && serialized.length > 0) {
          params.set(String(key), serialized)
        }
      }
      return params.toString()
    },
    [config, sortedKeys],
  )

  const validateAll = useCallback(
    (values: Schema): FilterErrors<Schema> => {
      const nextErrors: FilterErrors<Schema> = {}
      for (const key of sortedKeys) {
        const validator = config[key].validate
        if (validator) {
          const result = validator(values[key])
          nextErrors[key] = result === true ? null : typeof result === 'string' ? result : 'Valor inválido'
        } else {
          nextErrors[key] = null
        }
      }
      return nextErrors
    },
    [config, sortedKeys],
  )

  const applyFilters = useCallback(
    (partial?: Partial<Schema>, strategy?: 'push' | 'replace') => {
      const candidate = { ...filters, ...(partial as Partial<Schema>) } as Schema
      const nextErrors = validateAll(candidate)
      setErrors(nextErrors)

      const hasErrors = Object.values(nextErrors).some(e => e && e.length > 0)
      if (hasErrors) {
        return
      }

      setFilters(candidate)

      const query = toQueryString(candidate)
      lastSyncedQueryRef.current = query
      const url = query ? `${pathname}?${query}` : pathname
      const mode = strategy ?? replaceStrategy

      startTransition(() => {
        if (mode === 'replace') {
          router.replace(url)
        } else {
          router.push(url)
        }
      })
    },
    [filters, pathname, replaceStrategy, router, toQueryString, validateAll],
  )

  const setFilter = useCallback(<K extends keyof Schema>(key: K, value: Schema[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateFilters = useCallback((partial: Partial<Schema>) => {
    setFilters(prev => ({ ...prev, ...(partial as Schema) }))
  }, [])

  const resetFilters = useCallback(() => {
    const defaults: Schema = sortedKeys.reduce((acc, key) => {
      acc[key] = config[key].default
      return acc
    }, {} as Schema)
    applyFilters(defaults, 'replace')
  }, [applyFilters, config, sortedKeys])

  useEffect(() => {
    const normalized = normalizeSearchParams(searchParams)
    if (normalized === lastSyncedQueryRef.current) {
      return
    }

    const parsed = parseParams(searchParams)
    const nextErrors = validateAll(parsed)
    setErrors(nextErrors)
    lastSyncedQueryRef.current = normalized
    setFilters(parsed)
  }, [parseParams, searchParams, validateAll])

  return {
    filters,
    errors,
    setFilter,
    updateFilters,
    applyFilters,
    resetFilters,
    toQueryString,
  }
}

export const parsers = {
  string: (fallback = '') => (raw: string | null) => (raw ?? fallback),
  number: (fallback = 0) => (raw: string | null) => {
    if (raw == null || raw.trim() === '') return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  },
}

export const serializers = {
  string: (omitIfEmpty = true) => (value: string) => {
    if (omitIfEmpty && (!value || value.length === 0)) return null
    return value
  },
  number: () => (value: number) => String(value),
}

export const validators = {
  nonEmpty: (msg = 'Campo obrigatório') => (value: string) =>
    value && value.trim().length > 0 ? true : msg,
  inRange: (min: number, max: number) => (value: number) =>
    Number.isFinite(value) && value >= min && value <= max
      ? true
      : `Valor deve estar entre ${min} e ${max}`,
  oneOf: <T extends string>(allowed: readonly T[]) => (value: T) =>
    allowed.includes(value) ? true : `Valor deve ser um de: ${allowed.join(', ')}`,
}
