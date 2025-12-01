import { PDFDocument } from 'pdf-lib'

export interface PdfFile {
  id: string
  name: string
  pageCount: number
  arrayBuffer: ArrayBuffer
}

export async function mergePdfs(pdfFiles: PdfFile[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()

  for (const pdfFile of pdfFiles) {
    try {
      const uint8Array = new Uint8Array(pdfFile.arrayBuffer)
      const pdf = await PDFDocument.load(uint8Array)
      const pageIndices = pdf.getPageIndices()
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)

      for (const page of copiedPages) {
        mergedPdf.addPage(page)
      }
    } catch (err) {
      console.error(`Failed to merge PDF: ${pdfFile.name}`, err)
      throw new Error(`PDFの合体に失敗しました: ${pdfFile.name}`)
    }
  }

  return mergedPdf.save()
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
