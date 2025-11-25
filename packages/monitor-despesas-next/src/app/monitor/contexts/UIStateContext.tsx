/**
 * UI State Context
 * 
 * Context simplificado que mantém APENAS estado de UI.
 * Dados (deputados, fornecedores, etc) devem vir via Server Actions/props.
 * 
 * Estado mantido aqui:
 * - Filtros de pesquisa (searchTerm)
 * - Ano selecionado (selectedYear)
 * - Estado de UI (sidebar, modais, etc)
 * 
 * NÃO mantém:
 * - ❌ Dados de deputados
 * - ❌ Dados de fornecedores
 * - ❌ Alertas ou análises
 * - ❌ Transações
 */

'use client'

import React, { createContext, useContext, useReducer, type ReactNode } from 'react'

// ==============================================================================
// Types
// ==============================================================================

interface UIState {
  // Filtros
  searchTerm: string
  selectedYear: string
  
  // Estado de UI
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
}

type UIAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_YEAR'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'RESET_FILTERS' }

// ==============================================================================
// Initial State
// ==============================================================================

const initialState: UIState = {
  searchTerm: '',
  selectedYear: new Date().getFullYear().toString(),
  sidebarOpen: true,
  theme: 'system'
}

// ==============================================================================
// Reducer
// ==============================================================================

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload }
      
    case 'SET_SELECTED_YEAR':
      return { ...state, selectedYear: action.payload }
      
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
      
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload }
      
    case 'SET_THEME':
      return { ...state, theme: action.payload }
      
    case 'RESET_FILTERS':
      return {
        ...state,
        searchTerm: '',
        selectedYear: new Date().getFullYear().toString()
      }
      
    default:
      return state
  }
}

// ==============================================================================
// Context
// ==============================================================================

interface UIContextValue {
  state: UIState
  dispatch: React.Dispatch<UIAction>
  
  // Helper actions
  setSearchTerm: (term: string) => void
  setSelectedYear: (year: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resetFilters: () => void
}

const UIContext = createContext<UIContextValue | undefined>(undefined)

// ==============================================================================
// Provider
// ==============================================================================

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState)

  // Helper functions
  const setSearchTerm = (term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term })
  }

  const setSelectedYear = (year: string) => {
    dispatch({ type: 'SET_SELECTED_YEAR', payload: year })
  }

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const setSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR', payload: open })
  }

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' })
  }

  const value: UIContextValue = {
    state,
    dispatch,
    setSearchTerm,
    setSelectedYear,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    resetFilters
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

// ==============================================================================
// Hook
// ==============================================================================

export function useUIState() {
  const context = useContext(UIContext)
  
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider')
  }
  
  return context
}

// ==============================================================================
// Hooks Específicos (Conveniência)
// ==============================================================================

/**
 * Hook para acessar apenas os filtros
 */
export function useFilters() {
  const { state, setSearchTerm, setSelectedYear, resetFilters } = useUIState()
  
  return {
    searchTerm: state.searchTerm,
    selectedYear: state.selectedYear,
    setSearchTerm,
    setSelectedYear,
    resetFilters
  }
}

/**
 * Hook para acessar apenas o estado da sidebar
 */
export function useSidebar() {
  const { state, toggleSidebar, setSidebarOpen } = useUIState()
  
  return {
    isOpen: state.sidebarOpen,
    toggle: toggleSidebar,
    setOpen: setSidebarOpen
  }
}

/**
 * Hook para acessar apenas o tema
 */
export function useTheme() {
  const { state, setTheme } = useUIState()
  
  return {
    theme: state.theme,
    setTheme
  }
}



