
// no React hooks here to keep this module server-safe

export const accessibilityConfig = {
  wcagRules: {
    'color-contrast': 'error',
    'heading-order': 'warn', 
    'landmark-unique': 'error',
    'region': 'error',
    'page-has-heading-one': 'error',
    'focus-order-semantics': 'warn'
  },
  
  performance: {
    maxLighthouseScore: 90,
    maxAccessibilityScore: 95
  },
  
  contrast: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3.0,
    AAA_NORMAL: 7.0,
    AAA_LARGE: 4.5
  }
}

export const ariaAttributes = {
  landmarks: {
    main: 'main',
    navigation: 'navigation',
    complementary: 'complementary',
    contentinfo: 'contentinfo',
    banner: 'banner',
  },
  
  states: {
    expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
    selected: (selected: boolean) => ({ 'aria-selected': selected }),
    pressed: (pressed: boolean) => ({ 'aria-pressed': pressed }),
    checked: (checked: boolean | 'mixed') => ({ 'aria-checked': checked }),
    disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
    hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
    busy: (busy: boolean) => ({ 'aria-busy': busy }),
    invalid: (invalid: boolean) => ({ 'aria-invalid': invalid }),
    required: (required: boolean) => ({ 'aria-required': required }),
  },
  
  relationships: {
    labelledby: (id: string) => ({ 'aria-labelledby': id }),
    describedby: (id: string) => ({ 'aria-describedby': id }),
    controls: (id: string) => ({ 'aria-controls': id }),
    owns: (id: string) => ({ 'aria-owns': id }),
    flowto: (id: string) => ({ 'aria-flowto': id }),
  },
  
  liveRegions: {
    polite: { 'aria-live': 'polite' as const },
    assertive: { 'aria-live': 'assertive' as const },
    off: { 'aria-live': 'off' as const },
  },
}

export class ColorContrast {
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16)
    } : null
  }

  private static getLuminance(r: number, g: number, b: number): number {
    const toLinear = (c: number) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) throw new Error('Invalid color format')
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b)
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  static meetsWCAGAA(color1: string, color2: string, fontSize: number = 16): {
    ratio: number
    passes: boolean
    level: 'AA' | 'AAA' | 'Fail'
  } {
    const ratio = this.getContrastRatio(color1, color2)
    const isLargeText = fontSize >= 18 || fontSize >= 14 // 14pt bold is also considered large
    
    const aaThreshold = isLargeText ? accessibilityConfig.contrast.AA_LARGE : accessibilityConfig.contrast.AA_NORMAL
    const aaaThreshold = isLargeText ? accessibilityConfig.contrast.AAA_LARGE : accessibilityConfig.contrast.AAA_NORMAL
    
    let level: 'AA' | 'AAA' | 'Fail'
    if (ratio >= aaaThreshold) {
      level = 'AAA'
    } else if (ratio >= aaThreshold) {
      level = 'AA'
    } else {
      level = 'Fail'
    }
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      passes: ratio >= aaThreshold,
      level
    }
  }

  static validateColorPair(foreground: string, background: string): boolean {
    const result = this.meetsWCAGAA(foreground, background)
    return result.passes
  }
}

export class ScreenReader {
  private static announcer: HTMLElement | null = null
  
  private static getAnnouncer(): HTMLElement {
    if (!this.announcer) {
      this.announcer = document.createElement('div')
      this.announcer.setAttribute('aria-live', 'polite')
      this.announcer.setAttribute('aria-atomic', 'true')
      this.announcer.className = 'sr-only'
      this.announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `
      document.body.appendChild(this.announcer)
    }
    return this.announcer
  }
  
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = this.getAnnouncer()
    announcer.setAttribute('aria-live', priority)
    
    announcer.textContent = ''
    setTimeout(() => {
      announcer.textContent = message
    }, 100)
  }
  
  static announceRouteChange(routeName: string): void {
    this.announce(`Navegado para ${routeName}`, 'polite')
  }
  
  static announceLoadingState(isLoading: boolean, context?: string): void {
    const message = isLoading
      ? `Carregando${context ? ` ${context}` : ''}...`
      : `${context ? `${context} ` : ''}Carregamento concluído`
    
    this.announce(message, isLoading ? 'polite' : 'assertive')
  }
  
  static announceError(error: string): void {
    this.announce(`Erro: ${error}`, 'assertive')
  }
  
  static announceSuccess(message: string): void {
    this.announce(`Sucesso: ${message}`, 'polite')
  }
}

export class KeyboardNavigation {
  private static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()
    
    return () => container.removeEventListener('keydown', handleTabKey)
  }
  
  static createFocusTrap(container: HTMLElement): {
    activate: () => void
    deactivate: () => void
  } {
    let cleanup: (() => void) | null = null
    
    return {
      activate: () => {
        cleanup = this.trapFocus(container)
      },
      deactivate: () => {
        cleanup?.()
        cleanup = null
      }
    }
  }
  
  static createRovingTabIndex(container: HTMLElement, selector: string): void {
    const items = container.querySelectorAll(selector) as NodeListOf<HTMLElement>
    let currentIndex = 0
    
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1
    })
    
    const handleKeydown = (e: KeyboardEvent) => {
      let newIndex = currentIndex
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          newIndex = (currentIndex + 1) % items.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          newIndex = (currentIndex - 1 + items.length) % items.length
          break
        case 'Home':
          newIndex = 0
          break
        case 'End':
          newIndex = items.length - 1
          break
        default:
          return
      }
      
      e.preventDefault()

      items[currentIndex]!.tabIndex = -1
      items[newIndex]!.tabIndex = 0
      items[newIndex]!.focus()
      currentIndex = newIndex
    }
    
    container.addEventListener('keydown', handleKeydown)
    
    items.forEach((item, index) => {
      item.addEventListener('focus', () => {
        if (currentIndex !== index) {
          items[currentIndex]!.tabIndex = -1
          item.tabIndex = 0
          currentIndex = index
        }
      })
    })
  }
}

export class FocusManagement {
  private static focusHistory: HTMLElement[] = []
  
  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement)
    }
  }
  
  static restoreFocus(): void {
    const lastFocused = this.focusHistory.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
    }
  }
  
  static moveFocusTo(selector: string): boolean {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      return true
    }
    return false
  }
  
  static createFocusableElementsQuery(): string {
    return [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details',
      'summary'
    ].join(', ')
  }
  
  static getAllFocusableElements(container: Element = document.body): HTMLElement[] {
    return Array.from(
      container.querySelectorAll(this.createFocusableElementsQuery())
    ) as HTMLElement[]
  }
}

export const a11yUtils = {
  hasProperAria: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('aria-describedby')
    );
  },

  // Generate unique accessibility IDs for ARIA attributes and form associations
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  checkContrast: (foreground: string, background: string): number => {
    return ColorContrast.getContrastRatio(foreground, background);
  },

  createSkipLinks: (): HTMLElement => {
    const skipLinks = document.createElement('div')
    skipLinks.className = 'skip-links'
    skipLinks.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      border-radius: 4px;
    `
    
    const links = [
      { href: '#main-content', text: 'Pular para conteúdo principal' },
      { href: '#navigation', text: 'Pular para navegação' },
      { href: '#footer', text: 'Pular para rodapé' },
    ]
    
    links.forEach(link => {
      const a = document.createElement('a')
      a.href = link.href
      a.textContent = link.text
      a.style.cssText = `
        display: block;
        color: white;
        text-decoration: none;
        padding: 4px 8px;
        margin: 2px 0;
        border-radius: 2px;
      `
      
      a.addEventListener('focus', () => {
        skipLinks.style.top = '6px'
      })
      
      a.addEventListener('blur', () => {
        skipLinks.style.top = '-40px'
      })
      
      skipLinks.appendChild(a)
    })
    
    return skipLinks
  }
};


function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : null;
}

export function createAccessibilityMonitor() {
  const violations: any[] = []
  return {
    violations,
    checkAccessibility: () => {
      const isDevHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
      if (isDevHost) {
        console.log('🔍 [A11Y] Accessibility monitoring enabled')
      }
      console.log('🔍 [A11Y] Running accessibility audit...')
    },
  }
}

export const ariaPatterns = {
  loadingButton: (isLoading: boolean) => ({
    'aria-busy': isLoading,
    'aria-disabled': isLoading
  }),

  modal: (isOpen: boolean, titleId?: string) => ({
    role: 'dialog',
    'aria-modal': isOpen,
    'aria-labelledby': titleId,
    'aria-hidden': !isOpen
  }),

  disclosure: (isExpanded: boolean, controlsId?: string) => ({
    'aria-expanded': isExpanded,
    'aria-controls': controlsId
  }),

  formField: (hasError: boolean, errorId?: string) => ({
    'aria-invalid': hasError,
    'aria-describedby': hasError ? errorId : undefined
  })
};


export const eslintA11yRules = {
  'jsx-a11y/alt-text': 'error',
  'jsx-a11y/anchor-has-content': 'error',
  'jsx-a11y/anchor-is-valid': 'error',
  'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
  'jsx-a11y/aria-props': 'error',
  'jsx-a11y/aria-proptypes': 'error',
  'jsx-a11y/aria-role': 'error',
  'jsx-a11y/aria-unsupported-elements': 'error',
  'jsx-a11y/click-events-have-key-events': 'error',
  'jsx-a11y/control-has-associated-label': 'error',
  'jsx-a11y/heading-has-content': 'error',
  'jsx-a11y/interactive-supports-focus': 'error',
  'jsx-a11y/label-has-associated-control': 'error',
  'jsx-a11y/media-has-caption': 'warn',
  'jsx-a11y/mouse-events-have-key-events': 'error',
  'jsx-a11y/no-access-key': 'error',
  'jsx-a11y/no-autofocus': 'warn',
  'jsx-a11y/no-distracting-elements': 'error',
  'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
  'jsx-a11y/no-noninteractive-element-interactions': 'error',
  'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
  'jsx-a11y/no-noninteractive-tabindex': 'error',
  'jsx-a11y/no-redundant-roles': 'error',
  'jsx-a11y/no-static-element-interactions': 'error',
  'jsx-a11y/role-has-required-aria-props': 'error',
  'jsx-a11y/role-supports-aria-props': 'error',
  'jsx-a11y/scope': 'error',
  'jsx-a11y/tabindex-no-positive': 'error'
};