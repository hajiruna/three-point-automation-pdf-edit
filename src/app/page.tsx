'use client'

import { useCallback, useState } from 'react'
import {
  PdfUploader,
  PdfPageGrid,
  PdfToolbar,
  PdfPreviewModal,
  PdfMergeUploader,
  PdfMergeList,
} from '@/components/pdf'
import { Tabs, useToast } from '@/components/ui'
import { usePdfDocument, usePageSelection, usePdfRenderer, usePdfMerge } from '@/hooks'
import {
  extractPages,
  downloadPdf,
  generateOutputFileName,
  mergePdfs,
  generateMergedFileName,
  getTotalPageCount,
} from '@/lib/pdf'
import { logPdfExtraction, logPdfMerge } from '@/lib/supabase/logger'

type TabId = 'extract' | 'merge'

const tabs = [
  {
    id: 'extract' as const,
    label: 'ページ抽出',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'merge' as const,
    label: 'PDF合体',
    color: 'pink' as const,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('extract')
  const { showToast } = useToast()

  // Extract feature state
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

  // Merge feature state
  const {
    pdfs: mergePdfs_list,
    isLoading: isMergeLoading,
    error: mergeError,
    addFiles: addMergeFiles,
    removePdf: removeMergePdf,
    reorderPdfs,
    clearAll: clearMergeAll,
  } = usePdfMerge()

  const [isMerging, setIsMerging] = useState(false)

  // Extract handlers
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

      logPdfExtraction({
        file_name: document.fileName,
        total_pages: document.totalPages,
        selected_pages: selectedArray,
        pages_extracted: selectedArray.length,
      })

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

  // Merge handlers
  const handleMergeDownload = useCallback(async () => {
    if (mergePdfs_list.length < 2) return

    setIsMerging(true)

    try {
      const pdfBytes = await mergePdfs(mergePdfs_list)
      const outputFileName = generateMergedFileName(mergePdfs_list)
      await downloadPdf(pdfBytes, outputFileName)

      logPdfMerge({
        file_names: mergePdfs_list.map((pdf) => pdf.name),
        file_count: mergePdfs_list.length,
        total_pages: getTotalPageCount(mergePdfs_list),
      })

      showToast(`${mergePdfs_list.length}個のPDFを合体しました`, 'success')
    } catch (err) {
      console.error('Failed to merge PDFs:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      showToast(`PDFの合体に失敗しました: ${errorMessage}`, 'error')
    } finally {
      setIsMerging(false)
    }
  }, [mergePdfs_list, showToast])

  // Render Extract Tab Content
  const renderExtractContent = () => {
    if (loadError) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
            <p className="text-gray-500 mb-6">{loadError}</p>
            <button onClick={handleReset} className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
              もう一度試す
            </button>
          </div>
        </div>
      )
    }

    if (!document) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">PDFページを選択して抽出</h2>
            <p className="text-gray-600 max-w-md">PDFファイルをアップロードして、必要なページだけを選んで<br />ダウンロードできます</p>
          </div>

          <PdfUploader onFileSelect={handleFileSelect} isLoading={isLoadingPdf} />

          {isLoadingPdf && loadingProgress > 0 && (
            <div className="mt-6 w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>読み込み中...</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col pb-24">
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

        <div className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PdfPageGrid pages={document.pages} selectedPages={selectedPages} onTogglePage={togglePage} onPreviewPage={handlePreviewPage} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-green-600">{selectedPages.size}</span>
                <span className="text-gray-600">ページ選択中</span>
                {selectedPages.size > 0 && (
                  <span className="text-sm text-gray-500">({Array.from(selectedPages).sort((a, b) => a - b).join(', ')})</span>
                )}
              </div>
              <button
                onClick={handleDownload}
                disabled={selectedPages.size === 0 || isExporting}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg text-lg font-bold transition-all duration-200 ${
                  selectedPages.size > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
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

  // Render Merge Tab Content
  const renderMergeContent = () => {
    const totalPages = getTotalPageCount(mergePdfs_list)

    return (
      <div className="flex-1 flex flex-col pb-24">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">複数のPDFを合体</h2>
            <p className="text-gray-600 max-w-md mx-auto">PDFファイルを追加後、下部のリスト（一番左の二本線）を上下に<br />ドラッグすることで、順番を変更できます</p>
          </div>

          {/* Uploader */}
          <PdfMergeUploader onFilesSelect={addMergeFiles} isLoading={isMergeLoading} hasFiles={mergePdfs_list.length > 0} />

          {/* Error */}
          {mergeError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{mergeError}</div>
          )}

          {/* PDF List */}
          {mergePdfs_list.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {mergePdfs_list.length}個のPDF（合計{totalPages}ページ）
                </h3>
                <button onClick={clearMergeAll} className="text-sm text-red-500 hover:text-red-700 transition-colors">
                  すべて削除
                </button>
              </div>

              <PdfMergeList pdfs={mergePdfs_list} onReorder={reorderPdfs} onRemove={removeMergePdf} />
            </div>
          )}
        </div>

        {/* Fixed Bottom Bar */}
        {mergePdfs_list.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-600">{mergePdfs_list.length}</span>
                  <span className="text-gray-600">個のPDF（{totalPages}ページ）</span>
                </div>
                <button
                  onClick={handleMergeDownload}
                  disabled={mergePdfs_list.length < 2 || isMerging}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg text-lg font-bold transition-all duration-200 ${
                    mergePdfs_list.length >= 2 ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isMerging ? (
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
                      PDFを合体してダウンロード
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab Selector */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'extract' ? renderExtractContent() : renderMergeContent()}
    </div>
  )
}
