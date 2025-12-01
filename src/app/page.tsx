'use client'

import { useCallback, useState } from 'react'
import { PdfUploader, PdfPageGrid, PdfToolbar, PdfPreviewModal } from '@/components/pdf'
import { useToast } from '@/components/ui'
import { usePdfDocument, usePageSelection, usePdfRenderer } from '@/hooks'
import { extractPages, downloadPdf, generateOutputFileName } from '@/lib/pdf'

export default function Home() {
  const { showToast } = useToast()
  const {
    document,
    pdfProxy,
    isLoading: isLoadingPdf,
    loadingProgress,
    error: loadError,
    loadFile,
    reset: resetDocument,
  } = usePdfDocument()

  const {
    selectedPages,
    togglePage,
    selectAll,
    deselectAll,
    reset: resetSelection,
  } = usePageSelection()

  const {
    previewUrl,
    previewPage,
    isLoading: isLoadingPreview,
    loadPreview,
    clearPreview,
  } = usePdfRenderer()

  const [isExporting, setIsExporting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleFileSelect = useCallback(
    async (file: File) => {
      resetSelection()
      await loadFile(file)
    },
    [loadFile, resetSelection]
  )

  const handleReset = useCallback(() => {
    resetDocument()
    resetSelection()
  }, [resetDocument, resetSelection])

  const handleSelectAll = useCallback(() => {
    if (document) {
      selectAll(document.totalPages)
    }
  }, [document, selectAll])

  const handleDownload = useCallback(async () => {
    if (!document || selectedPages.size === 0) return

    setIsExporting(true)

    try {
      const selectedArray = Array.from(selectedPages)
      const pdfBytes = await extractPages(document.arrayBuffer, selectedArray, pdfProxy ?? undefined)
      const outputFileName = generateOutputFileName(document.fileName)
      await downloadPdf(pdfBytes, outputFileName)

      showToast(`${selectedPages.size}ページを抽出しました`, 'success')
    } catch (err) {
      console.error('Failed to export PDF:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      showToast(`PDFの抽出に失敗しました: ${errorMessage}`, 'error')
    } finally {
      setIsExporting(false)
    }
  }, [document, selectedPages, pdfProxy, showToast])

  const handlePreviewPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfProxy) return

      setIsPreviewOpen(true)
      await loadPreview(pdfProxy, pageNumber)
    },
    [pdfProxy, loadPreview]
  )

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false)
    clearPreview()
  }, [clearPreview])

  const handlePrevPage = useCallback(async () => {
    if (!pdfProxy || !previewPage || previewPage <= 1) return
    await loadPreview(pdfProxy, previewPage - 1)
  }, [pdfProxy, previewPage, loadPreview])

  const handleNextPage = useCallback(async () => {
    if (!pdfProxy || !previewPage || !document || previewPage >= document.totalPages) return
    await loadPreview(pdfProxy, previewPage + 1)
  }, [pdfProxy, previewPage, document, loadPreview])

  // Show error if PDF loading failed
  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[--color-text-primary] mb-2">
            エラーが発生しました
          </h2>
          <p className="text-[--color-text-muted] mb-6">{loadError}</p>
          <button
            onClick={handleReset}
            className="
              px-6 py-2 rounded-lg
              bg-[--color-accent-500] text-white
              hover:bg-[--color-accent-600]
              transition-colors
            "
          >
            もう一度試す
          </button>
        </div>
      </div>
    )
  }

  // Show upload screen
  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Instructions */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-text-primary] mb-3">
            PDFページを選択して抽出
          </h2>
          <p className="text-[--color-text-secondary] max-w-md">
            PDFファイルをアップロードして、必要なページだけを選んでダウンロードできます
          </p>
        </div>

        {/* Uploader */}
        <PdfUploader onFileSelect={handleFileSelect} isLoading={isLoadingPdf} />

        {/* Loading Progress */}
        {isLoadingPdf && loadingProgress > 0 && (
          <div className="mt-6 w-full max-w-xs">
            <div className="flex justify-between text-sm text-[--color-text-muted] mb-2">
              <span>読み込み中...</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="h-2 bg-[--color-border-light] rounded-full overflow-hidden">
              <div
                className="h-full bg-[--color-accent-500] transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* How to use */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
          {[
            {
              step: '1',
              title: 'PDFをアップロード',
              description: 'ドラッグ&ドロップまたはクリックで選択',
            },
            {
              step: '2',
              title: 'ページを選択',
              description: '残したいページをクリック（Shift+クリックで範囲選択）',
            },
            {
              step: '3',
              title: 'ダウンロード',
              description: '選択したページだけの新しいPDFを取得',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[--color-accent-100] text-[--color-accent-600] font-bold flex items-center justify-center">
                {item.step}
              </div>
              <h3 className="font-medium text-[--color-text-primary] mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-[--color-text-muted]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show PDF editor
  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Toolbar */}
      <PdfToolbar
        fileName={document.fileName}
        totalPages={document.totalPages}
        selectedCount={selectedPages.size}
        isExporting={isExporting}
        onSelectAll={handleSelectAll}
        onDeselectAll={deselectAll}
        onDownload={handleDownload}
        onReset={handleReset}
      />

      {/* Page Grid */}
      <div className="flex-1 bg-[--color-off-white]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hint */}
          <p className="text-sm text-[--color-text-muted] mb-4">
            <span className="font-medium">ヒント:</span> Shiftキーを押しながらクリックすると範囲選択できます
          </p>

          <PdfPageGrid
            pages={document.pages}
            selectedPages={selectedPages}
            onTogglePage={togglePage}
            onPreviewPage={handlePreviewPage}
          />
        </div>
      </div>

      {/* Fixed Download Button - iLovePDF style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Selection Summary */}
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-green-600">
                {selectedPages.size}
              </span>
              <span className="text-gray-600">
                ページ選択中
              </span>
              {selectedPages.size > 0 && (
                <span className="text-sm text-gray-500">
                  ({Array.from(selectedPages).sort((a, b) => a - b).join(', ')})
                </span>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={selectedPages.size === 0 || isExporting}
              className={`
                flex items-center gap-2
                px-8 py-3 rounded-lg
                text-lg font-bold
                transition-all duration-200
                ${selectedPages.size > 0
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  処理中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDFをダウンロード
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        pageNumber={previewPage ?? 1}
        imageUrl={previewUrl}
        totalPages={document.totalPages}
        isLoading={isLoadingPreview}
        onClose={handleClosePreview}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
      />
    </div>
  )
}
