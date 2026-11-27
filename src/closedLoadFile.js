import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { pdfFromHtml, printHtml } from './printPage';
import { escapeHtml, statementDocument } from './statementHtml';

function closedLoadHtml(report) {
  const rows = (report.trucks || []).map((truck) => `
    <tr>
      <td>${escapeHtml(truck.sno)}</td>
      <td>${escapeHtml(truck.truckNo)}${truck.trip ? ` (Trip ${escapeHtml(truck.trip)})` : ''}</td>
      <td>${escapeHtml(truck.entered ? truck.setNo : 'Not entered')}</td>
      <td>${escapeHtml(truck.entered ? (truck.wagonNo || '—') : 'Not entered')}</td>
      <td>${escapeHtml(truck.entered ? truck.bags : 'Not entered')}</td>
      <td>${escapeHtml(truck.deliveryTo || '—')}</td>
    </tr>`).join('');
  return statementDocument({
    title: 'CLOSED RR LOAD',
    reference: `RR ${report.rrNo}`,
    fields: [
      ['RR No', report.rrNo],
      ['RR Date', report.rrDate],
      ['FNR', report.fnr],
      ['Party name', report.partyName],
      ['Station From', report.stationFrom],
      ['Station To', report.stationTo],
      ['Commodity', report.commodity],
      ['Trucks gone', report.trucksGone],
      ['Total bags', report.totalBags],
      ['Bags taken', report.bagsTaken],
      ['Balance bags', report.balanceBags],
    ],
    body: `<table class="data">
      <thead><tr><th>S.no</th><th>Truck number</th><th>Set no</th><th>Wagon no</th><th>Bags</th><th>Delivery to</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">No trucks on this RR</td></tr>'}</tbody>
    </table>`,
  });
}

async function createPdf(report) {
  const file = await pdfFromHtml(closedLoadHtml(report));
  return file.uri;
}

export async function printClosedLoad(report) {
  await printHtml(closedLoadHtml(report));
}

export async function shareClosedLoad(report) {
  const uri = await createPdf(report);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `RR ${report.rrNo} load`, UTI: 'com.adobe.pdf' });
}

export async function downloadClosedLoad(report) {
  const uri = await createPdf(report);
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) throw new Error('Choose a folder, such as Downloads, to save this RR load.');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, `RR-load-${report.rrNo}`, 'application/pdf');
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}
