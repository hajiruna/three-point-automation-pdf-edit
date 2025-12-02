'use client'

import { useCallback, useRef } from 'react'
import { useTheme } from '@/components/ui'

interface PdfMergeUploaderProps {
  onFilesSelect: (files: File[]) => void
  isLoading?: boolean
  hasFiles?: boolean
}

export function PdfMergeUploader({ onFilesSelect, isLoading = false, hasFiles = false }: PdfMergeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (isLoading) return

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf'
      )

      if (files.length > 0) {
        onFilesSelect(files)
      }
    },
    [isLoading, onFilesSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleClick = useCallback(() => {
    if (!isLoading) {
      inputRef.current?.click()
    }
  }, [isLoading])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesSelect(files)
      }
      // Reset input
      e.target.value = ''
    },
    [onFilesSelect]
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
          : hasFiles
            ? isDark
              ? 'border-pink-400 bg-pink-900/30 hover:border-pink-300 hover:bg-pink-900/50'
              : 'border-pink-300 bg-pink-50 hover:border-pink-400 hover:bg-pink-100'
            : isDark
              ? 'border-pink-400 bg-gray-800 hover:border-pink-300 hover:bg-pink-900/30'
              : 'border-pink-300 bg-white hover:border-pink-400 hover:bg-pink-50'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          ${hasFiles
            ? isDark ? 'bg-pink-800' : 'bg-pink-100'
            : isDark ? 'bg-gray-700' : 'bg-gray-100'
          }
        `}>
          <svg
            className={`w-8 h-8 ${
              hasFiles
                ? isDark ? 'text-pink-300' : 'text-pink-500'
                : isDark ? 'text-gray-400' : 'text-gray-400'
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
            hasFiles
              ? isDark ? 'text-pink-300' : 'text-pink-700'
              : isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {hasFiles ? 'PDFを追加' : 'PDFファイルをドロップ'}
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            またはクリックして選択（複数選択可）
          </p>
        </div>
      </div>

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
  )
}
