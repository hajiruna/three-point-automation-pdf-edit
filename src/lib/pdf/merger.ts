import { PDFDocument } from 'pdf-lib'
import { loadPdfDocument } from './loader'

// DPI for image-based fallback (same as extractor)
const EXPORT_DPI = 300

export interface PdfFile {
  id: string
  name: string
  pageCount: number
  arrayBuffer: ArrayBuffer
}

export async function mergePdfs(pdfFiles: PdfFile[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()

  for (const pdfFile of pdfFiles) {
    // Create copies of the ArrayBuffer before any operations
    const arrayBufferForPdfLib = pdfFile.arrayBuffer.slice(0)
    const arrayBufferForPdfjs = pdfFile.arrayBuffer.slice(0)

    try {
      // First, try direct copy with pdf-lib (preserves text as searchable text)
      const uint8Array = new Uint8Array(arrayBufferForPdfLib)
      const pdf = await PDFDocument.load(uint8Array)
      const pageIndices = pdf.getPageIndices()
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)

      for (const page of copiedPages) {
        mergedPdf.addPage(page)
      }
    } catch (directError) {
      console.warn(`Direct copy failed for ${pdfFile.name}, using image-based fallback:`, directError)

      // Fallback: use high-quality image-based conversion via PDF.js
      try {
        await addPagesAsImages(mergedPdf, arrayBufferForPdfjs)
      } catch (fallbackError) {
        console.error(`Failed to merge PDF: ${pdfFile.name}`, fallbackError)
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        throw new Error(`${pdfFile.name}: ${errorMessage}`)
      }
    }
  }

  return mergedPdf.save()
}

// Add pages from a PDF as high-quality images (fallback method)
async function addPagesAsImages(targetPdf: PDFDocument, sourceArrayBuffer: ArrayBuffer): Promise<void> {
  // Load with PDF.js for rendering
  const pdfProxy = await loadPdfDocument(sourceArrayBuffer)

  for (let pageNum = 1; pageNum <= pdfProxy.numPages; pageNum++) {
    const page = await pdfProxy.getPage(pageNum)

    // Get original page dimensions
    const originalViewport = page.getViewport({ scale: 1.0 })

    // Calculate scale for target DPI
    const scale = EXPORT_DPI / 72
    const viewport = page.getViewport({ scale })

    // Create canvas and render
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas context not available')

    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    // White background
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Render with print quality
    await page.render({
      canvasContext: context,
      viewport,
      intent: 'print',
    }).promise

    // Convert to PNG
    const imageDataUrl = canvas.toDataURL('image/png')
    const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer())

    // Embed in PDF
    const image = await targetPdf.embedPng(imageBytes)

    // Add page with original dimensions
    const pageWidth = originalViewport.width
    const pageHeight = originalViewport.height
    const pdfPage = targetPdf.addPage([pageWidth, pageHeight])

    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    })

    // Clean up
    canvas.width = 0
    canvas.height = 0
  }

  // Clean up PDF.js proxy
  pdfProxy.destroy()
}

export function generateMergedFileName(pdfFiles: PdfFile[]): string {
  if (pdfFiles.length === 0) return 'merged.pdf'
  if (pdfFiles.length === 1) return pdfFiles[0].name

  // Use first file name as base
  const baseName = pdfFiles[0].name.replace(/\.pdf$/i, '')
  return `${baseName}_merged.pdf`
}

export function getTotalPageCount(pdfFiles: PdfFile[]): number {
  return pdfFiles.reduce((total, pdf) => total + pdf.pageCount, 0)
}
