import { PDFDocument, PrintScaling } from 'pdf-lib'

/**
 * Stamp ViewerPreferences so print dialogs default to Actual Size / no
 * fit-to-page scaling. Browser "Fit" is a common cause of blank stationery
 * and values overlays landing on different slots on the dot-matrix.
 */
export async function finalizePdfBlob(blob) {
  const bytes = await blob.arrayBuffer()
  const doc = await PDFDocument.load(bytes)
  const prefs = doc.catalog.getOrCreateViewerPreferences()
  prefs.setPrintScaling(PrintScaling.None)
  try {
    prefs.setPickTrayByPDFSize(true)
  } catch {
    // older pdf-lib builds may omit this helper
  }
  const out = await doc.save()
  return new Blob([out], { type: 'application/pdf' })
}
