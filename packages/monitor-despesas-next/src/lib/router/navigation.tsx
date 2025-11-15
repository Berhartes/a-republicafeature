'use client'

import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter, usePathname, useSearchParams, useParams as useRouteParams } from 'next/navigation'

interface NavigateOptions {
  to: string
  replace?: boolean
  params?: Record<string, string | number | undefined>
  search?: Record<string, any>
  hash?: string
}

interface RouterStateLocation {
  pathname: string
  search: string
  hash: string
}

interface RouterState {
  location: RouterStateLocation
}

interface LinkProps extends Omit<NextLinkProps, 'href'> {
  to: string
  params?: Record<string, string | number | undefined>
  search?: Record<string, any>
  hash?: string
  activeProps?: Partial<React.ComponentProps<'a'>>
  inactiveProps?: Partial<React.ComponentProps<'a'>>
  className?: string
}

interface UseParamsOptions {
  from?: string
}

type ParamValue = string | undefined

type ParamsRecord = Record<string, ParamValue>

const buildPathWithParams = (to: string, params?: Record<string, string | number | undefined>) => {
  if (!params) return to

  return to.replace(/\$([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = params[key]
    if (value === undefined || value === null) {
      return ''
    }
    return encodeURIComponent(String(value))
  })
}

const buildSearch = (search?: Record<string, any>) => {
  if (!search || Object.keys(search).length === 0) {
    return ''
  }

  const params = new URLSearchParams()

  Object.entries(search).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null) return
        params.append(key, String(item))
      })
      return
    }

    if (typeof value === 'object') {
      params.append(key, JSON.stringify(value))
      return
    }

    params.append(key, String(value))
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

const buildHref = ({ to, params, search, hash }: NavigateOptions) => {
  const pathname = buildPathWithParams(to, params)
  const searchPart = buildSearch(search)
  const hashPart = hash ? `#${hash.replace(/^#/, '')}` : ''
  return `${pathname}${searchPart}${hashPart}`
}

export const Link = forwardRef<HTMLAnchorElement, React.PropsWithChildren<LinkProps>>(function RouterLink(
  { to, params, search, hash, activeProps, inactiveProps, className, ...rest },
  ref,
) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const href = buildHref({ to, params, search, hash })

  const isActive = useMemo(() => {
    if (!pathname) return false

    const [targetPathname, targetSearch] = href.split('?')
    if (targetPathname !== pathname) {
      return false
    }

    if (!targetSearch) {
      return true
    }

    const targetQuery = new URLSearchParams(targetSearch)
    const currentQuery = new URLSearchParams(searchParams?.toString() ?? '')

    for (const [key, value] of targetQuery.entries()) {
      if (currentQuery.get(key) !== value) {
        return false
      }
    }

    return true
  }, [href, pathname, searchParams])

  const resolvedProps = isActive ? activeProps : inactiveProps
  const finalClassName = [className, resolvedProps?.className].filter(Boolean).join(' ')

  return (
    <NextLink
      ref={ref}
      href={href}
      {...rest}
      {...resolvedProps}
      className={finalClassName || undefined}
    />
  )
})

export function useNavigate() {
  const router = useRouter()

  return useCallback(
    ({ to, replace, params, search, hash }: NavigateOptions) => {
      const href = buildHref({ to, replace, params, search, hash })
      if (replace) {
        router.replace(href)
      } else {
        router.push(href)
      }
    },
    [router],
  )
}

export function useParams<T extends ParamsRecord = ParamsRecord>(options?: UseParamsOptions): T {
  const params = useRouteParams()

  if (!options?.from) {
    const normalized = Object.entries(params).reduce<Record<string, string | undefined>>((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined
      return acc
    }, {})

    return normalized as T
  }

  const keys = Array.from(options.from.matchAll(/\$([A-Za-z0-9_]+)/g)).map((match) => match[1])

  const selected = keys.reduce<Record<string, string | undefined>>((acc, key) => {
    const value = params[key]
    acc[key] = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined
    return acc
  }, {})

  return selected as T
}

export function useLocation(): RouterStateLocation {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash ?? '')
    }

    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  return useMemo(() => {
    const search = searchParams && searchParams.toString() ? `?${searchParams.toString()}` : ''

    return {
      pathname: pathname || '/',
      search,
      hash,
    }
  }, [hash, pathname, searchParams])
}

export function useRouterState(): RouterState {
  const location = useLocation()
  return useMemo(() => ({ location }), [location])
}

export type { RouterState }
