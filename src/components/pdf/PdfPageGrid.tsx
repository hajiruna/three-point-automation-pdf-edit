'use client'

import { PdfPageCard } from './PdfPageCard'
import type { PdfPage } from '@/types/pdf'

interface PdfPageGridProps {
  pages: PdfPage[]
  selectedPages: Set<number>
  onTogglePage: (pageNumber: number, shiftKey: boolean) => void
  onPreviewPage: (pageNumber: number) => void
}

export function PdfPageGrid({
  pages,
  selectedPages,
  onTogglePage,
  onPreviewPage,
}: PdfPageGridProps) {
  return (
    <div
      className="
        grid gap-4 p-2
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
        overflow-visible
      "
    >
      {pages.map((page) => (
        <PdfPageCard
          key={page.pageNumber}
          pageNumber={page.pageNumber}
          thumbnail={page.thumbnail}
          isSelected={selectedPages.has(page.pageNumber)}
          onToggle={(shiftKey) => onTogglePage(page.pageNumber, shiftKey)}
          onPreview={() => onPreviewPage(page.pageNumber)}
        />
      ))}
    </div>
  )
}
