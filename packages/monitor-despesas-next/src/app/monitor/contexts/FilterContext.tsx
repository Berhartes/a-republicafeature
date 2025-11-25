'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

type FilterState = {
  selectedCategory?: string
  setSelectedCategory: (c?: string) => void
}

const FilterContext = createContext<FilterState | undefined>(undefined)

export function FilterProvider({ children, initialCategory }: { children: React.ReactNode; initialCategory?: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory)

  const value = useMemo<FilterState>(() => ({ selectedCategory, setSelectedCategory }), [selectedCategory])

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilter(): FilterState {
  const ctx = useContext(FilterContext)
  if (!ctx) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return ctx
}


