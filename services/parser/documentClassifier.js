/**
 * Document Classifier
 * Detects document type from MIME type and content density signals.
 * Returns routing metadata so the OCR layer knows how to process the file.
 */
const { DOCUMENT_TYPES } = require('./utils/constants')

/**
 * Checks if a PDF buffer contains a meaningful text layer.
 * PDFs with <50 significant characters are treated as scanned/image-based.
 *
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{ hasTextLayer: boolean, charCount: number, rawText: string }>}
 */
const probePdfTextLayer = async (buffer) => {
  try {
    const pdf = require('pdf-parse')
    const parsed = await pdf(buffer)
    const text = (parsed.text || '').replace(/\s+/g, '').trim()
    return {
      hasTextLayer: text.length >= 50,
      charCount: text.length,
      rawText: parsed.text || ''
    }
  } catch {
    return { hasTextLayer: false, charCount: 0, rawText: '' }
  }
}

/**
 * Classifies the uploaded document and returns routing instructions.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{
 *   documentType: string,
 *   needsOCR: boolean,
 *   needsPDFParser: boolean,
 *   confidence: number,
 *   prefetchedText: string|null
 * }>}
 */
const classifyDocument = async (buffer, mimeType) => {
  // --- Image types → always need OCR ---
  if (['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'].includes(mimeType)) {
    return {
      documentType: DOCUMENT_TYPES.SCREENSHOT,
      needsOCR: true,
      needsPDFParser: false,
      confidence: 95,
      prefetchedText: null
    }
  }

  // --- PDF → probe text layer ---
  if (mimeType === 'application/pdf') {
    const { hasTextLayer, charCount, rawText } = await probePdfTextLayer(buffer)

    if (hasTextLayer) {
      // Digital PDF with extractable text — no OCR needed
      return {
        documentType: DOCUMENT_TYPES.DIGITAL_PDF,
        needsOCR: false,
        needsPDFParser: true,
        confidence: 98,
        prefetchedText: rawText   // Already extracted — reuse in OCR stage
      }
    } else {
      // Scanned PDF — text layer empty or near-empty
      return {
        documentType: DOCUMENT_TYPES.SCANNED_PDF,
        needsOCR: true,
        needsPDFParser: false,
        confidence: 85,
        prefetchedText: null
      }
    }
  }

  // --- Unknown type ---
  return {
    documentType: DOCUMENT_TYPES.UNKNOWN,
    needsOCR: true,
    needsPDFParser: false,
    confidence: 40,
    prefetchedText: null
  }
}

module.exports = {
  classifyDocument,
  probePdfTextLayer
}
