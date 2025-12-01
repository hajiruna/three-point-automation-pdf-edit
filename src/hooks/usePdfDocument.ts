'use client'

import { useState, useCallback } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PdfDocument, PdfPage } from '@/types/pdf'
import { loadPdfDocument, readFileAsArrayBuffer, generateThumbnails } from '@/lib/pdf'

interface UsePdfDocumentReturn {
  document: PdfDocument | null
  pdfProxy: PDFDocumentProxy | null
  isLoading: boolean
  loadingProgress: number
  error: string | null
  loadFile: (file: File) => Promise<void>
  reset: () => void
}

export function usePdfDocument(): UsePdfDocumentReturn {
  const [document, setDocument] = useState<PdfDocument | null>(null)
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file)

      // Create a copy for pdf-lib (ArrayBuffer can only be transferred once)
      const arrayBufferCopy = arrayBuffer.slice(0)

      // Load PDF document with PDF.js
      const proxy = await loadPdfDocument(arrayBuffer)
      setPdfProxy(proxy)

      // Generate thumbnails for all pages
      const pages = await generateThumbnails(proxy, (current, total) => {
        setLoadingProgress(Math.round((current / total) * 100))
      })

      // Create document object (use the copy for pdf-lib extraction)
      const doc: PdfDocument = {
        fileName: file.name,
        totalPages: proxy.numPages,
        pages,
        arrayBuffer: arrayBufferCopy,
      }

      setDocument(doc)
    } catch (err) {
      console.error('Failed to load PDF:', err)
      setError(
        err instanceof Error
          ? `PDFの読み込みに失敗しました: ${err.message}`
          : 'PDFの読み込みに失敗しました'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    if (pdfProxy) {
      pdfProxy.destroy()
    }
    setDocument(null)
    setPdfProxy(null)
    setError(null)
    setLoadingProgress(0)
  }, [pdfProxy])

  return {
    document,
    pdfProxy,
    isLoading,
    loadingProgress,
    error,
    loadFile,
    reset,
  }
}
