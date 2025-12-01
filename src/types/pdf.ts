export interface PdfPage {
  pageNumber: number
  thumbnail: string
  width: number
  height: number
}

export interface PdfDocument {
  fileName: string
  totalPages: number
  pages: PdfPage[]
  arrayBuffer: ArrayBuffer
}

export interface PdfState {
  document: PdfDocument | null
  selectedPages: Set<number>
  isLoading: boolean
  error: string | null
}
