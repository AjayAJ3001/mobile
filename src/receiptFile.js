import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { pdfFromHtml, printHtml } from './printPage';
import { receiptHtml } from './receiptSheet';

async function createPdf(receipt) {
  const file = await pdfFromHtml(receiptHtml(receipt));
  return file.uri;
}

export async function printReceipt(receipt) {
  await printHtml(receiptHtml(receipt));
}

export async function shareReceipt(receipt) {
  const uri = await createPdf(receipt);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `RR ${receipt.rrNo}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function downloadReceipt(receipt) {
  const uri = await createPdf(receipt);
  const filename = `RR-${receipt.rrNo}.pdf`;
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Choose a folder, such as Downloads, to save the receipt.');
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    filename.replace(/\.pdf$/i, ''),
    'application/pdf'
  );
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}
