import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { pdfFromHtml, printHtml } from './printPage';

import { escapeHtml, statementDocument } from './statementHtml';

function closeHtml(report) {
  const rows = (report.trucks || []).map((truck) => `
    <tr>
      <td>${escapeHtml(truck.sno)}</td>
      <td>${escapeHtml(truck.truckNo)}</td>
      <td>${escapeHtml(truck.setNo)}</td>
      <td>${escapeHtml(truck.bags)}</td>
      <td>${escapeHtml(truck.deliveryTo || '—')}</td>
    </tr>`).join('');
  return statementDocument({
    title: 'RR CLOSED',
    reference: `RR ${report.rrNo}`,
    fields: [
      ['RR No', report.rrNo],
      ['RR Date', report.rrDate],
      ['FNR', report.fnr],
      ['Party name', report.partyName],
      ['Station From', report.stationFrom],
      ['Station To', report.stationTo],
      ['Commodity', report.commodity],
      ['Total bags taken', report.totalBagsTaken],
      ['Trucks taken', report.trucksTaken],
    ],
    body: `<table class="data">
      <thead><tr><th>S.no</th><th>Truck number</th><th>Set no</th><th>Bags</th><th>Delivery to</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No trucks taken</td></tr>'}</tbody>
    </table>`,
  });
}

async function createPdf(report) {
  const file = await pdfFromHtml(closeHtml(report));
  return file.uri;
}

export async function printClose(report) {
  await printHtml(closeHtml(report));
}

export async function shareClose(report) {
  const uri = await createPdf(report);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `RR closed ${report.rrNo}`, UTI: 'com.adobe.pdf' });
}

export async function downloadClose(report) {
  const uri = await createPdf(report);
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) throw new Error('Choose a folder, such as Downloads, to save the RR closed sheet.');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, `RR-closed-${report.rrNo}`, 'application/pdf');
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}
