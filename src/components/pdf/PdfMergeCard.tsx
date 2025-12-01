'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PdfFile } from '@/lib/pdf'

interface PdfMergeCardProps {
  pdf: PdfFile
  index: number
  onRemove: (id: string) => void
}

export function PdfMergeCard({ pdf, index, onRemove }: PdfMergeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pdf.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-4 p-4
        bg-white rounded-xl border-2
        transition-all duration-200
        ${isDragging
          ? 'border-blue-500 shadow-lg scale-105 z-50'
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 -m-2 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Order Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* PDF Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{pdf.name}</p>
        <p className="text-sm text-gray-500">{pdf.pageCount}ページ</p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(pdf.id)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        aria-label="削除"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
