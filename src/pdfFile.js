import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import { authHeaders, discoverServer, getBaseUrl } from './api';

function safeName(name, id) {
  const cleaned = String(name || `pdf-${id}.pdf`).replace(/[\\/:*?"<>|]+/g, '-').trim() || `pdf-${id}.pdf`;
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

export async function cachePdf(path, fileName) {
  await discoverServer();
  const name = safeName(fileName, 'file');
  const destination = `${FileSystem.cacheDirectory}${Date.now()}-${name}`;
  const result = await FileSystem.downloadAsync(`${getBaseUrl()}${path}`, destination, { headers: authHeaders() });
  if (result.status !== 200) throw new Error('Could not open the stored PDF.');
  return { uri: result.uri, name };
}

export async function viewPdf(path, fileName) {
  const file = await cachePdf(path, fileName);
  if (Platform.OS === 'android' && FileSystem.getContentUriAsync) {
    try {
      const content = await FileSystem.getContentUriAsync(file.uri);
      await Linking.openURL(content);
      return;
    } catch {
      // The share sheet can still open the PDF.
    }
  }
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Opening a PDF is not available on this phone.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Open PDF', UTI: 'com.adobe.pdf' });
}

export async function sharePdf(path, fileName) {
  const file = await cachePdf(path, fileName);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF', UTI: 'com.adobe.pdf' });
}

async function writePdf(directoryUri, file) {
  const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, file.name.replace(/\.pdf$/i, ''), 'application/pdf');
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}

export async function downloadPdfs(files) {
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) throw new Error('Choose a folder, such as Downloads, to save the PDF.');
  for (const file of files) await writePdf(permission.directoryUri, file);
}
