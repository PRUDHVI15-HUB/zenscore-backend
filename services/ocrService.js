/**
 * OCR Service (Smart Edition)
 *
 * Routes file extraction to:
 * - Native pdf-parse for digital PDFs (fast, lossless)
 * - Tesseract.js for scanned PDFs and images (with table-optimized PSM mode)
 *
 * Does NOT perform any interpretation — returns only raw extracted text.
 */

/**
 * Extracts text from a digital PDF buffer using pdf-parse.
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Raw text
 */
const extractPdfText = async (buffer) => {
  try {
    const pdf = require('pdf-parse')
    const parsedData = await pdf(buffer)
    return parsedData.text || ''
  } catch (err) {
    throw new Error(`Unable to read PDF: ${err.message}`)
  }
}

/**
 * Extracts text from an image or scanned PDF buffer using Tesseract.js.
 * Uses PSM 6 (assume a single uniform block of text) for table-heavy images.
 * Falls back to PSM 4 if the initial result is very sparse.
 *
 * @param {Buffer} buffer - Image or scanned PDF buffer
 * @returns {Promise<string>} Raw OCR text
 */
const extractImageText = async (buffer) => {
  let worker = null
  try {
    const { createWorker } = require('tesseract.js')

    worker = await createWorker('eng')

    // PSM 6: Assume a single uniform block of text (best for structured tables)
    await worker.setParameters({
      tessedit_pageseg_mode: '6'
    })

    const { data: { text } } = await worker.recognize(buffer)

    // If result is very sparse (< 30 chars), retry with PSM 4 (column detection)
    if (!text || text.replace(/\s+/g, '').length < 30) {
      await worker.setParameters({ tessedit_pageseg_mode: '4' })
      const { data: { text: text2 } } = await worker.recognize(buffer)
      return text2 || ''
    }

    return text || ''
  } catch (err) {
    throw new Error(`Unable to process image: ${err.message}`)
  } finally {
    if (worker) {
      try { await worker.terminate() } catch { /* suppress */ }
    }
  }
}

/**
 * Main OCR extraction entry point.
 * Accepts a pre-fetched text string (from document classifier) to avoid double parsing.
 *
 * @param {Buffer} buffer - The uploaded file buffer
 * @param {string} mimeType - The file's MIME type
 * @param {Object} [classifierResult] - Optional result from documentClassifier
 * @returns {Promise<string>} Plain raw text extracted from the document
 */
const extractText = async (buffer, mimeType, classifierResult = null) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty file buffer provided.')
  }
  if (!mimeType) {
    throw new Error('Mime type is required.')
  }

  // If classifier already extracted PDF text, reuse it (avoid double parsing)
  if (classifierResult?.prefetchedText) {
    const clean = classifierResult.prefetchedText.trim()
    if (clean.length >= 50) {
      return clean
    }
  }

  let text = ''

  if (mimeType === 'application/pdf') {
    // Try native PDF text extraction first
    text = await extractPdfText(buffer)

    // If text is sparse (scanned PDF), fall through to OCR
    if (!text || text.replace(/\s+/g, '').trim().length < 50) {
      text = await extractImageText(buffer)
    }
  } else if (['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'].includes(mimeType)) {
    text = await extractImageText(buffer)
  } else {
    throw new Error(`Unsupported mime type: ${mimeType}`)
  }

  const cleanText = text.trim()
  if (!cleanText) {
    throw new Error('Empty OCR result. The document may be blank or unreadable.')
  }

  return cleanText
}

module.exports = {
  extractText,
  extractPdfText,
  extractImageText
}
