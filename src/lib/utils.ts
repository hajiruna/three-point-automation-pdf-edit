export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * PDFファイルサイズ制限（50MB）
 */
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024

/**
 * PDFマジックナンバー（ファイルヘッダー）
 * PDFファイルは必ず '%PDF' で始まる
 */
const PDF_MAGIC_NUMBER = [0x25, 0x50, 0x44, 0x46] // %PDF

/**
 * MIMEタイプと拡張子による基本チェック（非同期検証前の簡易チェック）
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * PDFファイルを厳密に検証（マジックナンバー、サイズチェック含む）
 * @param file 検証対象のファイル
 * @returns 検証結果とエラーメッセージ
 */
export async function validatePdfFile(file: File): Promise<{
  valid: boolean
  error?: string
}> {
  // 1. 基本チェック（MIMEタイプと拡張子）
  if (!isPdfFile(file)) {
    return { valid: false, error: 'PDFファイルを選択してください' }
  }

  // 2. ファイルサイズチェック
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます（最大${formatFileSize(MAX_PDF_SIZE_BYTES)}）`,
    }
  }

  // 3. ファイルが空でないことを確認
  if (file.size === 0) {
    return { valid: false, error: 'ファイルが空です' }
  }

  // 4. マジックナンバー検証（%PDF）
  try {
    const header = await readFileHeader(file, 4)
    const isValidMagic = PDF_MAGIC_NUMBER.every((byte, index) => header[index] === byte)

    if (!isValidMagic) {
      return { valid: false, error: '無効なPDFファイル形式です' }
    }
  } catch {
    return { valid: false, error: 'ファイルの読み取りに失敗しました' }
  }

  return { valid: true }
}

/**
 * ファイルの先頭バイトを読み取る
 */
async function readFileHeader(file: File, length: number): Promise<Uint8Array> {
  const slice = file.slice(0, length)
  const buffer = await slice.arrayBuffer()
  return new Uint8Array(buffer)
}
