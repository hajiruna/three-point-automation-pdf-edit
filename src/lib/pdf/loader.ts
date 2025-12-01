import type { PDFDocumentProxy } from 'pdfjs-dist'

let pdfjsLib: typeof import('pdfjs-dist') | null = null
let isInitialized = false

async function getPdfjs() {
  if (pdfjsLib && isInitialized) return pdfjsLib

  // Dynamic import for client-side only
  const pdfjs = await import('pdfjs-dist')

  // Configure worker using CDN for v4
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`

  pdfjsLib = pdfjs
  isInitialized = true

  return pdfjs
}

export async function loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs()

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
    cMapPacked: true,
  })

  return loadingTask.promise
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
