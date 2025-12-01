import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { PdfPage } from '@/types/pdf'

const THUMBNAIL_SCALE = 0.3
const PREVIEW_SCALE = 1.5

export async function renderPageToCanvas(
  page: PDFPageProxy,
  scale: number = THUMBNAIL_SCALE
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    canvasContext: context,
    viewport,
  }).promise

  return {
    canvas,
    width: viewport.width,
    height: viewport.height,
  }
}

export async function renderPageToDataUrl(
  page: PDFPageProxy,
  scale: number = THUMBNAIL_SCALE
): Promise<{ dataUrl: string; width: number; height: number }> {
  const { canvas, width, height } = await renderPageToCanvas(page, scale)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

  // Clean up canvas to free memory
  canvas.width = 0
  canvas.height = 0

  return { dataUrl, width, height }
}

export async function generateThumbnails(
  pdfDocument: PDFDocumentProxy,
  onProgress?: (current: number, total: number) => void
): Promise<PdfPage[]> {
  const pages: PdfPage[] = []
  const totalPages = pdfDocument.numPages

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDocument.getPage(i)
    const { dataUrl, width, height } = await renderPageToDataUrl(page, THUMBNAIL_SCALE)

    pages.push({
      pageNumber: i,
      thumbnail: dataUrl,
      width,
      height,
    })

    onProgress?.(i, totalPages)
  }

  return pages
}

export async function renderPagePreview(
  pdfDocument: PDFDocumentProxy,
  pageNumber: number
): Promise<string> {
  const page = await pdfDocument.getPage(pageNumber)
  const { dataUrl } = await renderPageToDataUrl(page, PREVIEW_SCALE)
  return dataUrl
}
