'use client'

import { useCallback, useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Spinner } from '@/components/ui'
import { useTheme } from '@/components/ui'
import { isPdfFile } from '@/lib/utils'

interface PdfUploaderProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export function PdfUploader({ onFileSelect, isLoading = false }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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

      if (isLoading) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile, isLoading]
  )

  const handleClick = useCallback(() => {
    if (!isLoading) {
      inputRef.current?.click()
    }
  }, [isLoading])

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
        onClick={handleClick}
        className={`
          relative
          border-2 border-dashed rounded-2xl
          p-8
          text-center
          cursor-pointer
          transition-all duration-200
          ${isLoading
            ? isDark
              ? 'border-gray-600 bg-gray-800 cursor-not-allowed'
              : 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : isDragging
              ? 'border-blue-400 bg-blue-100'
              : isDark
                ? 'border-blue-400 bg-gray-800 hover:border-blue-300 hover:bg-blue-900/30'
                : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
          aria-label="PDFファイルを選択"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              PDFを読み込んでいます...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Plus Icon */}
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              transition-colors duration-200
              ${isDragging
                ? 'bg-blue-200'
                : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-100'
              }
            `}>
              <svg
                className={`w-8 h-8 transition-colors duration-200 ${
                  isDragging
                    ? 'text-blue-500'
                    : isDark
                      ? 'text-gray-400'
                      : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            {/* Text */}
            <div>
              <p className={`text-lg font-medium ${
                isDragging
                  ? 'text-blue-700'
                  : isDark
                    ? 'text-gray-200'
                    : 'text-gray-700'
              }`}>
                {isDragging ? 'ここにドロップ' : 'PDFファイルをドロップ'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                またはクリックして選択
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-2xl ${
            isDark ? 'bg-gray-900/80' : 'bg-white/80'
          }`}>
            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>読み込み中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mt-4 p-4 rounded-lg ${
          isDark
            ? 'bg-red-900/50 border border-red-700'
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm text-center ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
        </div>
      )}
    </div>
  )
}
