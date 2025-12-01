'use client'

import { useState, useCallback, useRef, useMemo } from 'react'

interface UsePageSelectionReturn {
  selectedPages: Set<number>
  togglePage: (pageNumber: number, isShiftClick: boolean) => void
  selectAll: (totalPages: number) => void
  deselectAll: () => void
  reset: () => void
}

export function usePageSelection(): UsePageSelectionReturn {
  // Use array for better React state detection
  const [selectedArray, setSelectedArray] = useState<number[]>([])
  const lastClickedRef = useRef<number | null>(null)

  // Convert to Set for efficient lookups
  const selectedPages = useMemo(() => new Set(selectedArray), [selectedArray])

  const togglePage = useCallback((pageNumber: number, isShiftClick: boolean) => {
    setSelectedArray((prev) => {
      const currentSet = new Set(prev)

      if (isShiftClick && lastClickedRef.current !== null) {
        // Shift+click: select range
        const start = Math.min(lastClickedRef.current, pageNumber)
        const end = Math.max(lastClickedRef.current, pageNumber)

        for (let i = start; i <= end; i++) {
          currentSet.add(i)
        }
      } else {
        // Normal click: toggle single page
        if (currentSet.has(pageNumber)) {
          currentSet.delete(pageNumber)
        } else {
          currentSet.add(pageNumber)
        }
      }

      lastClickedRef.current = pageNumber
      return Array.from(currentSet).sort((a, b) => a - b)
    })
  }, [])

  const selectAll = useCallback((totalPages: number) => {
    const all: number[] = []
    for (let i = 1; i <= totalPages; i++) {
      all.push(i)
    }
    setSelectedArray(all)
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedArray([])
  }, [])

  const reset = useCallback(() => {
    setSelectedArray([])
    lastClickedRef.current = null
  }, [])

  return {
    selectedPages,
    togglePage,
    selectAll,
    deselectAll,
    reset,
  }
}
