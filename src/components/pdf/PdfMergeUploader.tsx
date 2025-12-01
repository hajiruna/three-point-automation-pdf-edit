'use client'

import { useCallback, useRef } from 'react'

interface PdfMergeUploaderProps {
  onFilesSelect: (files: File[]) => void
  isLoading?: boolean
  hasFiles?: boolean
}

export function PdfMergeUploader({ onFilesSelect, isLoading = false, hasFiles = false }: PdfMergeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

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
          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
          : hasFiles
            ? 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
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
          ${hasFiles ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <svg
            className={`w-8 h-8 ${hasFiles ? 'text-blue-500' : 'text-gray-400'}`}
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
          <p className={`text-lg font-medium ${hasFiles ? 'text-blue-700' : 'text-gray-700'}`}>
            {hasFiles ? 'PDFを追加' : 'PDFファイルをドロップ'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            またはクリックして選択（複数選択可）
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-600">
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
