'use client'

import Image from 'next/image'

interface PdfPageCardProps {
  pageNumber: number
  thumbnail: string
  isSelected: boolean
  onToggle: (shiftKey: boolean) => void
  onPreview: () => void
}

export function PdfPageCard({
  pageNumber,
  thumbnail,
  isSelected,
  onToggle,
  onPreview,
}: PdfPageCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle(e.shiftKey)
  }

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPreview()
  }

  return (
    <div
      className={`
        relative group
        rounded-xl overflow-visible
        border-2 transition-all duration-200
        cursor-pointer select-none
        ${isSelected
          ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-300'
          : 'border-[--color-border-light] bg-white hover:border-[--color-border-medium] hover:shadow-md'
        }
      `}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-[--color-off-white] rounded-t-lg overflow-hidden">
        <Image
          src={thumbnail}
          alt={`ページ ${pageNumber}`}
          fill
          className="object-contain p-2"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          draggable={false}
        />

        {/* Selection Indicator - Large centered checkbox */}
        <div
          className={`
            absolute inset-0 z-30
            flex items-center justify-center
            transition-all duration-200
            ${isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
            }
          `}
        >
          <div
            className={`
              w-16 h-16 rounded-full
              flex items-center justify-center
              shadow-xl border-4 border-white
              transition-all duration-200
              ${isSelected
                ? 'bg-green-500 scale-100'
                : 'bg-gray-500/70 scale-90'
              }
            `}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Preview Button (on hover) - only clickable when hovered */}
        <button
          onClick={handlePreviewClick}
          className="
            absolute inset-0 z-20
            flex items-center justify-center
            bg-black/0 group-hover:bg-black/30
            transition-all duration-200
            opacity-0 group-hover:opacity-100
            pointer-events-none group-hover:pointer-events-auto
          "
          aria-label={`ページ ${pageNumber} を拡大表示`}
        >
          <div className="p-3 rounded-full bg-white/90 shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <svg
              className="w-6 h-6 text-[--color-text-primary]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Page Number */}
      <div
        className={`
          py-2 text-center
          text-sm font-medium
          border-t
          transition-colors duration-200
          rounded-b-lg
          ${isSelected
            ? 'text-green-600 border-green-200 bg-green-50'
            : 'text-[--color-text-secondary] border-[--color-border-light]'
          }
        `}
      >
        {pageNumber}
      </div>
    </div>
  )
}
