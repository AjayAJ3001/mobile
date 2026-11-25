import * as Print from 'expo-print';

const A4 = { width: 595, height: 842 };
export const LANDSCAPE = { width: 842, height: 595 };
/** 3-inch roll: 76.2mm wide, one load slip tall. */
/** 3-inch roll: 76.2mm × 120mm (12 cm). */
export const RECEIPT_3IN = { width: 216, height: 340 };

export function printHtml(html, page = A4) {
  return Print.printAsync({ html, width: page.width, height: page.height });
}

export function pdfFromHtml(html, page = A4) {
  return Print.printToFileAsync({ html, width: page.width, height: page.height });
}
