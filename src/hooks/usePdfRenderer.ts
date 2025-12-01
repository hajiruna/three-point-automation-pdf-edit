'use client'

import { useState, useCallback, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { renderPagePreview } from '@/lib/pdf'

interface UsePdfRendererReturn {
  previewUrl: string | null
  previewPage: number | null
  isLoading: boolean
  loadPreview: (pdfProxy: PDFDocumentProxy, pageNumber: number) => Promise<void>
  clearPreview: () => void
}

export function usePdfRenderer(): UsePdfRendererReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewPage, setPreviewPage] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<Map<number, string>>(new Map())

  const loadPreview = useCallback(
    async (pdfProxy: PDFDocumentProxy, pageNumber: number) => {
      // Check cache first
      if (cacheRef.current.has(pageNumber)) {
        setPreviewUrl(cacheRef.current.get(pageNumber)!)
        setPreviewPage(pageNumber)
        return
      }

      setIsLoading(true)
      setPreviewPage(pageNumber)

      try {
        const url = await renderPagePreview(pdfProxy, pageNumber)
        cacheRef.current.set(pageNumber, url)
        setPreviewUrl(url)
      } catch (err) {
        console.error('Failed to render preview:', err)
        setPreviewUrl(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const clearPreview = useCallback(() => {
    setPreviewUrl(null)
    setPreviewPage(null)
  }, [])

  return {
    previewUrl,
    previewPage,
    isLoading,
    loadPreview,
    clearPreview,
  }
}
