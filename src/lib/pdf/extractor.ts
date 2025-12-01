import { PDFDocument } from 'pdf-lib'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Maximum quality scale for PDF rendering (300 DPI equivalent)
// Standard screen is 96 DPI, so 300/96 ≈ 3.125, we use 3.0 for safety
// Higher values may cause memory issues on large PDFs
const EXPORT_SCALE = 3.0
const EXPORT_DPI = 300

export async function extractPages(
  originalPdfBytes: ArrayBuffer,
  selectedPages: number[],
  pdfProxy?: PDFDocumentProxy
): Promise<Uint8Array> {
  // Sort pages to maintain order
  const sortedPages = [...selectedPages].sort((a, b) => a - b)

  // Try direct copy first (works for non-encrypted PDFs)
  try {
    const uint8Array = new Uint8Array(originalPdfBytes)
    const originalPdf = await PDFDocument.load(uint8Array)

    const newPdf = await PDFDocument.create()
    const pagesToCopy = sortedPages.map((pageNum) => pageNum - 1)
    const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy)

    for (const page of copiedPages) {
      newPdf.addPage(page)
    }

    return newPdf.save()
  } catch (err) {
    console.warn('Direct extraction failed, using high-quality image conversion:', err)

    // Fallback: use high-quality image-based extraction for encrypted PDFs
    if (!pdfProxy) {
      throw new Error('暗号化されたPDFの抽出にはPDF.jsプロキシが必要です')
    }

    return extractPagesAsImages(pdfProxy, sortedPages)
  }
}

// Extract pages by rendering them as high-quality images
async function extractPagesAsImages(
  pdfProxy: PDFDocumentProxy,
  selectedPages: number[]
): Promise<Uint8Array> {
  const newPdf = await PDFDocument.create()

  for (const pageNum of selectedPages) {
    const page = await pdfProxy.getPage(pageNum)

    // Get original page dimensions (in PDF points, 72 points per inch)
    const originalViewport = page.getViewport({ scale: 1.0 })

    // Calculate scale to achieve target DPI
    // PDF points to pixels: points * (targetDPI / 72)
    const scale = EXPORT_DPI / 72

    const viewport = page.getViewport({ scale })

    // Create canvas and render page at high resolution
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', {
      alpha: false,  // Disable alpha for better performance
    })
    if (!context) throw new Error('Canvas context not available')

    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    // White background
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Render with high quality settings
    await page.render({
      canvasContext: context,
      viewport,
      intent: 'print',  // Use print quality rendering
    }).promise

    // Convert canvas to PNG (lossless, best for documents)
    const imageDataUrl = canvas.toDataURL('image/png')
    const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer())

    // Embed image in PDF
    const image = await newPdf.embedPng(imageBytes)

    // Page size in points (same as original)
    const pageWidth = originalViewport.width
    const pageHeight = originalViewport.height

    // Add page with original dimensions
    const pdfPage = newPdf.addPage([pageWidth, pageHeight])

    // Draw image to fill the page (at 300 DPI resolution)
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    })

    // Clean up canvas to free memory
    canvas.width = 0
    canvas.height = 0
  }

  return newPdf.save()
}

export async function downloadPdf(pdfBytes: Uint8Array, fileName: string): Promise<void> {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })

  // Try to use File System Access API for folder selection (modern browsers)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (options: {
        suggestedName: string
        types: Array<{ description: string; accept: Record<string, string[]> }>
      }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PDF Files',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err) {
      // User cancelled or API not supported, fall back to traditional download
      if ((err as Error).name === 'AbortError') {
        throw new Error('ダウンロードがキャンセルされました')
      }
    }
  }

  // Fallback: traditional download
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateOutputFileName(originalFileName: string): string {
  const baseName = originalFileName.replace(/\.pdf$/i, '')
  return `${baseName}_selected.pdf`
}
