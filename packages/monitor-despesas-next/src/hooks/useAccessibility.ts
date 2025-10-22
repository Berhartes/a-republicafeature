
import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  ScreenReader, 
  KeyboardNavigation, 
  FocusManagement,
  ColorContrast,
  ariaAttributes 
} from '@/lib/accessibility'

export const useScreenReader = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ScreenReader.announce(message, priority)
  }, [])

  const announceError = useCallback((error: string) => {
    ScreenReader.announceError(error)
  }, [])

  const announceSuccess = useCallback((message: string) => {
    ScreenReader.announceSuccess(message)
  }, [])

  const announceLoading = useCallback((isLoading: boolean, context?: string) => {
    ScreenReader.announceLoadingState(isLoading, context)
  }, [])

  const announceRouteChange = useCallback((routeName: string) => {
    ScreenReader.announceRouteChange(routeName)
  }, [])

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    announceRouteChange,
  }
}

export const useFocusManagement = () => {
  const saveFocus = useCallback(() => {
    FocusManagement.saveFocus()
  }, [])

  const restoreFocus = useCallback(() => {
    FocusManagement.restoreFocus()
  }, [])

  const moveFocusTo = useCallback((selector: string) => {
    return FocusManagement.moveFocusTo(selector)
  }, [])

  return {
    saveFocus,
    restoreFocus,
    moveFocusTo,
  }
}

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null)
  const focusTrapRef = useRef<{ activate: () => void; deactivate: () => void } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (isActive) {
      if (!focusTrapRef.current) {
        focusTrapRef.current = KeyboardNavigation.createFocusTrap(containerRef.current)
      }
      focusTrapRef.current.activate()
    } else {
      focusTrapRef.current?.deactivate()
    }

    return () => {
      focusTrapRef.current?.deactivate()
    }
  }, [isActive])

  return containerRef
}

export const useRovingTabIndex = (selector: string) => {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      KeyboardNavigation.createRovingTabIndex(containerRef.current, selector)
    }
  }, [selector])

  return containerRef
}

export const useLiveRegion = (priority: 'polite' | 'assertive' = 'polite') => {
  const [message, setMessage] = useState('')
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (regionRef.current && message) {
      regionRef.current.textContent = message
    }
  }, [message])

  const announce = useCallback((newMessage: string) => {
    setMessage(newMessage)
  }, [])

  const clear = useCallback(() => {
    setMessage('')
  }, [])

  return {
    regionRef,
    announce,
    clear,
    regionProps: {
      'aria-live': priority,
      'aria-atomic': true,
      className: 'sr-only',
    }
  }
}

export const useAccessibilityTesting = () => {
  const [violations, setViolations] = useState<any[]>([])

  const runBasicChecks = useCallback(async () => {
    console.log('🔍 [A11Y] Running basic accessibility checks...')
    
    const issues: any[] = []
    
    const images = document.querySelectorAll('img:not([alt])')
    images.forEach(img => {
      issues.push({
        type: 'missing-alt',
        message: 'Image missing alt attribute',
        element: img
      })
    })
    
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`)
      if (!label) {
        issues.push({
          type: 'missing-label',
          message: 'Form input missing label',
          element: input
        })
      }
    })
    
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        issues.push({
          type: 'empty-button',
          message: 'Button missing accessible text',
          element: button
        })
      }
    })

    setViolations(issues)
    return issues
  }, [])

  const logReport = useCallback(() => {
    runBasicChecks().then(issues => {
      const score = Math.max(0, 100 - (issues.length * 10))
      console.group('🔍 Accessibility Report')
      console.log(`Score: ${score}/100`)
      
      if (issues.length === 0) {
        console.log('✅ No accessibility issues found!')
      } else {
        console.log(`❌ Found ${issues.length} issue(s):`)
        issues.forEach(issue => {
          console.warn(`- ${issue.type}: ${issue.message}`, issue.element)
        })
      }
      
      console.groupEnd()
    })
  }, [runBasicChecks])

  return {
    violations,
    runBasicChecks,
    logReport,
  }
}

export const useColorContrast = () => {
  const validateContrast = useCallback((foreground: string, background: string, fontSize?: number) => {
    return ColorContrast.meetsWCAGAA(foreground, background, fontSize)
  }, [])

  const getContrastRatio = useCallback((color1: string, color2: string) => {
    return ColorContrast.getContrastRatio(color1, color2)
  }, [])

  return {
    validateContrast,
    getContrastRatio,
  }
}

export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const modifiers = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      }

      const combination = [
        modifiers.ctrl && 'ctrl',
        modifiers.alt && 'alt',
        modifiers.shift && 'shift',
        modifiers.meta && 'meta',
        key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta' && key,
      ]
        .filter(Boolean)
        .join('+')

      const handler = shortcuts[combination]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

const isBrowser = typeof window !== 'undefined'

export const useMotionPreference = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (!isBrowser) {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    if (!isBrowser) {
      return
    }
    const mediaQueries = [
      window.matchMedia('(-ms-high-contrast: active)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(forced-colors: active)'),
    ]

    const handler = () => {
      const highContrast = mediaQueries.some(mq => mq.matches)
      setIsHighContrast(highContrast)
    }

    handler()

    mediaQueries.forEach(mq => mq.addEventListener('change', handler))

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handler))
    }
  }, [])

  return isHighContrast
}

export const useAria = () => {
  return {
    expanded: ariaAttributes.states.expanded,
    selected: ariaAttributes.states.selected,
    pressed: ariaAttributes.states.pressed,
    checked: ariaAttributes.states.checked,
    disabled: ariaAttributes.states.disabled,
    hidden: ariaAttributes.states.hidden,
    busy: ariaAttributes.states.busy,
    invalid: ariaAttributes.states.invalid,
    required: ariaAttributes.states.required,
    
    labelledby: ariaAttributes.relationships.labelledby,
    describedby: ariaAttributes.relationships.describedby,
    controls: ariaAttributes.relationships.controls,
    owns: ariaAttributes.relationships.owns,
    flowto: ariaAttributes.relationships.flowto,
    
    liveRegion: ariaAttributes.liveRegions,
    
    landmarks: ariaAttributes.landmarks,
  }
}

export const useSkipLinks = () => {
  useEffect(() => {
    if (!isBrowser || typeof document === 'undefined') {
      return
    }
    const skipLinks = document.createElement('div')
    skipLinks.id = 'skip-links'
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Pular para conteúdo principal</a>
      <a href="#navigation" class="skip-link">Pular para navegação</a>
      <a href="#footer" class="skip-link">Pular para rodapé</a>
    `

    const style = document.createElement('style')
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000000;
        color: #ffffff;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 10000;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        transition: top 0.2s ease-in-out;
      }
      
      .skip-link:focus {
        top: 6px;
      }
      
      .skip-link:hover {
        background: #333333;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .skip-link {
          transition: none;
        }
      }
    `

    document.head.appendChild(style)
    document.body.insertBefore(skipLinks, document.body.firstChild)

    return () => {
      skipLinks.remove()
      style.remove()
    }
  }, [])
}

export const useAccessibility = (options: {
  enableSkipLinks?: boolean
  enableTesting?: boolean
  testingMode?: 'development' | 'always'
} = {}) => {
  const {
    enableSkipLinks = true,
    enableTesting = false,
    testingMode = 'development'
  } = options

  const screenReader = useScreenReader()
  const focusManagement = useFocusManagement()
  const testing = useAccessibilityTesting()
  const colorContrast = useColorContrast()
  const aria = useAria()
  const prefersReducedMotion = useMotionPreference()
  const isHighContrast = useHighContrast()

  if (enableSkipLinks) {
    useSkipLinks()
  }

  useEffect(() => {
    const shouldTest = enableTesting && (
      testingMode === 'always' || 
      (testingMode === 'development' && process.env.NODE_ENV === 'development')
    )

    if (shouldTest) {
      console.log('🔍 [A11Y] Accessibility monitoring enabled')
      const timeoutId = setTimeout(() => {
        testing.logReport()
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [])

  return {
    screenReader,
    focusManagement,
    testing,
    colorContrast,
    aria,
    preferences: {
      prefersReducedMotion,
      isHighContrast,
    },
  }
}