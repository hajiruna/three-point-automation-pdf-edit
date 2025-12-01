'use client'

import { useCallback, useState, DragEvent, ChangeEvent } from 'react'
import { Spinner } from '@/components/ui'
import { isPdfFile } from '@/lib/utils'

interface PdfUploaderProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export function PdfUploader({ onFileSelect, isLoading = false }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      if (!isPdfFile(file)) {
        setError('PDFファイルのみアップロード可能です')
        return
      }

      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative
          border-2 border-dashed rounded-2xl
          p-12 sm:p-16
          text-center
          transition-all duration-200
          cursor-pointer
          ${isDragging
            ? 'border-[--color-accent-500] bg-[--color-accent-50]'
            : 'border-[--color-border-medium] bg-white hover:border-[--color-accent-400] hover:bg-[--color-accent-50]'
          }
          ${isLoading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
          aria-label="PDFファイルを選択"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-lg text-[--color-text-secondary]">
              PDFを読み込んでいます...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Upload Icon */}
            <div className={`
              w-20 h-20 rounded-full
              flex items-center justify-center
              transition-colors duration-200
              ${isDragging ? 'bg-[--color-accent-100]' : 'bg-[--color-off-white]'}
            `}>
              <svg
                className={`w-10 h-10 transition-colors duration-200 ${
                  isDragging ? 'text-[--color-accent-500]' : 'text-[--color-text-muted]'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Instructions */}
            <div>
              <p className="text-xl font-medium text-[--color-text-primary] mb-2">
                {isDragging ? 'ここにドロップ' : 'PDFファイルをドラッグ&ドロップ'}
              </p>
              <p className="text-sm text-[--color-text-muted]">
                または<span className="text-[--color-accent-500] font-medium">クリックして選択</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
