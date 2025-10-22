import React, { forwardRef, useCallback, useMemo } from 'react'
import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/router'

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
  ref
) {
  const router = useRouter()
  const href = buildHref({ to, params, search, hash })

  const isActive = useMemo(() => {
    if (!router) return false
    const currentPath = router.asPath || ''
    // Remove query/hash when comparing
    const currentBase = currentPath.split(/[?#]/)[0]
    const targetBase = href.split(/[?#]/)[0]
    return currentBase === targetBase
  }, [router, href])

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
        void router.replace(href)
      } else {
        void router.push(href)
      }
    },
    [router]
  )
}

const normalizeParamValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export function useParams<T extends ParamsRecord = ParamsRecord>(options?: UseParamsOptions): T {
  const router = useRouter()
  const query = router.query

  if (!options?.from) {
    const params = Object.entries(query).reduce<Record<string, string | undefined>>((acc, [key, value]) => {
      acc[key] = normalizeParamValue(value)
      return acc
    }, {})

    return params as T
  }

  const keys = Array.from(options.from.matchAll(/\$([A-Za-z0-9_]+)/g)).map((match) => match[1])

  const params = keys.reduce<Record<string, string | undefined>>((acc, key) => {
    acc[key] = normalizeParamValue(query[key])
    return acc
  }, {})

  return params as T
}

export function useLocation(): RouterStateLocation {
  const router = useRouter()

  return useMemo(() => {
    const asPath = router.asPath || '/'
    const [pathWithQuery, hash = ''] = asPath.split('#')
    const [pathname = '/', searchValue = ''] = pathWithQuery.split('?')

    return {
      pathname: pathname || '/',
      search: searchValue ? `?${searchValue}` : '',
      hash: hash ? `#${hash}` : ''
    }
  }, [router.asPath])
}

export function useRouterState(): RouterState {
  const location = useLocation()
  return useMemo(() => ({ location }), [location])
}

export type { RouterState }
