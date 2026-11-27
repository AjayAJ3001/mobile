import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { pdfFromHtml, printHtml } from './printPage';
import { escapeHtml, statementDocument } from './statementHtml';

export function rrBagFields(rr) {
  return [
    ['RR No', rr.rrNo],
    ['RR Date', rr.rrDate],
    ['FNR', rr.fnr],
    ['Party name', rr.partyName],
    ['Station From', rr.stationFrom],
    ['Station To', rr.stationTo],
    ['Commodity', rr.commodityDescription],
    ['Wagons', rr.wagonCount],
    ['Total RR bags', rr.totalBags ?? 0],
    ['Bags taken', rr.bagsTaken ?? 0],
    ['Balance bags', rr.balanceBags ?? 0],
    ['Vehicles taken', rr.vehicleCount ?? (rr.vehicles || []).length],
  ];
}

function rrBagHtml(rr) {
  const setRows = (rr.sets || []).map((set) => `
    <tr>
      <td>Set ${escapeHtml(set.setNo)}</td>
      <td>${escapeHtml(set.totalBags)}</td>
      <td>${escapeHtml(set.bagsTaken)}</td>
      <td>${escapeHtml(set.balanceBags)}</td>
      <td>${escapeHtml(set.vehicleCount)}</td>
    </tr>`).join('');
  const vehicleRows = (rr.vehicles || []).map((v) => `
    <tr>
      <td>${escapeHtml(v.sno)}</td>
      <td>${escapeHtml(v.truckNo)}</td>
      <td>${escapeHtml(v.trip)}</td>
      <td>Set ${escapeHtml(v.setNo)}</td>
      <td>${escapeHtml(v.wagonNo || '—')}</td>
      <td>${escapeHtml(v.bags)}</td>
      <td>${escapeHtml(v.deliveryTo || '—')}</td>
    </tr>`).join('');
  return statementDocument({
    title: 'RR BAG STATEMENT',
    reference: `RR ${rr.rrNo}`,
    fields: rrBagFields(rr),
    body: `<h2>Set-wise bags</h2>
    <table class="data">
      <thead><tr><th>Set</th><th>Total bags</th><th>Bags taken</th><th>Balance</th><th>Vehicles</th></tr></thead>
      <tbody>${setRows || '<tr><td colspan="5">No sets</td></tr>'}</tbody>
    </table>
    <h2>Vehicles</h2>
    <table class="data">
      <thead><tr><th>S.no</th><th>Truck number</th><th>Trip</th><th>Set</th><th>Wagon no</th><th>Bags</th><th>Delivery to</th></tr></thead>
      <tbody>${vehicleRows || '<tr><td colspan="7">No vehicle has taken bags</td></tr>'}</tbody>
    </table>`,
  });
}

async function createPdf(rr) {
  const file = await pdfFromHtml(rrBagHtml(rr));
  return file.uri;
}

export async function printRrBags(rr) {
  await printHtml(rrBagHtml(rr));
}

export async function shareRrBags(rr) {
  const uri = await createPdf(rr);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `RR bags ${rr.rrNo}`, UTI: 'com.adobe.pdf' });
}

export async function downloadRrBags(rr) {
  const uri = await createPdf(rr);
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) throw new Error('Choose a folder, such as Downloads, to save the RR bag statement.');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, `RR-bags-${rr.rrNo}`, 'application/pdf');
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}
