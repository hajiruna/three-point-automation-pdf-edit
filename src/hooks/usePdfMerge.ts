'use client'

import { useState, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { loadPdfDocument, readFileAsArrayBuffer } from '@/lib/pdf'
import type { PdfFile } from '@/lib/pdf'

export function usePdfMerge() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback(async (files: File[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const newPdfs: PdfFile[] = []

      for (const file of files) {
        const arrayBuffer = await readFileAsArrayBuffer(file)
        const doc = await loadPdfDocument(arrayBuffer)

        newPdfs.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          pageCount: doc.numPages,
          arrayBuffer: arrayBuffer.slice(0), // Create a copy
        })
      }

      setPdfs((prev) => [...prev, ...newPdfs])
    } catch (err) {
      console.error('Failed to load PDFs:', err)
      setError('PDFの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removePdf = useCallback((id: string) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.id !== id))
  }, [])

  const reorderPdfs = useCallback((oldIndex: number, newIndex: number) => {
    setPdfs((prev) => arrayMove(prev, oldIndex, newIndex))
  }, [])

  const clearAll = useCallback(() => {
    setPdfs([])
    setError(null)
  }, [])

  return {
    pdfs,
    isLoading,
    error,
    addFiles,
    removePdf,
    reorderPdfs,
    clearAll,
  }
}
