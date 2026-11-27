import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { APP_NAME } from './brand';
import { LANDSCAPE, pdfFromHtml, printHtml } from './printPage';
import { escapeHtml } from './statementHtml';
import { TRAIN_LOGO } from './trainLogo';

function show(value) {
  return escapeHtml(value === 0 || value ? value : '—');
}

export function reportColumns(item = {}) {
  return [
    ['Vehicle no', item.truckNo],
    ['Trip', item.trip ? `Trip ${item.trip}` : 'Trip 1'],
    ['Wagon no', item.wagonNo],
    ['Party name', item.partyName],
    ['RR No', item.rrNo],
    ['Bags', item.bags],
    ['Set no', item.setNo],
    ['Balance bags', item.balanceBags],
    ['Total bags', item.totalBags],
    ['RR Date', item.rrDate],
    ['Date', item.date],
    ['FNR', item.fnr],
    ['Station from', item.stationFrom],
    ['Station to', item.stationTo],
    ['Commodity', item.commodity],
    ['Delivery to', item.deliveryTo],
    ['S.no', item.sno],
  ];
}

export const REPORT_WIDTHS = {
  'Vehicle no': 132,
  Trip: 72,
  'Wagon no': 96,
  'Party name': 168,
  'RR No': 118,
  Bags: 72,
  'Set no': 72,
  'Balance bags': 108,
  'Total bags': 100,
  'RR Date': 108,
  Date: 108,
  FNR: 140,
  'Station from': 120,
  'Station to': 120,
  Commodity: 120,
  'Delivery to': 150,
  'S.no': 56,
};

export function reportHtml(report) {
  const columns = reportColumns();
  const head = columns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join('');
  const items = (report.groups || []).flatMap((group) => group.items || []);
  const body = items.map((item) => `<tr>${reportColumns(item).map(([, value]) => `<td>${show(value)}</td>`).join('')}</tr>`).join('')
    || `<tr><td colspan="${columns.length}">No trucks have taken bags yet.</td></tr>`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(APP_NAME)} — REPORT</title>
  <style>
    @page { size: 842pt 595pt; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #122033; margin: 0; }
    .letter { width: 100%; border-collapse: collapse; }
    .letter td { border: 0; vertical-align: middle; padding: 0; }
    .logo { width: 42px; height: 42px; }
    .name { font-size: 16px; font-weight: 800; letter-spacing: 0.12em; color: #0B1B33; }
    .sub { margin-top: 2px; font-size: 9px; letter-spacing: 0.14em; font-weight: 700; color: #8a6424; }
    .rule { height: 3px; background: #0B1B33; border-bottom: 3px solid #E0A020; margin: 6px 0 8px; }
    .doc { text-align: center; font-size: 13px; letter-spacing: 0.2em; font-weight: 800; color: #0f6e8c; margin-bottom: 8px; }
    table.grid { width: 100%; border-collapse: collapse; }
    table.grid th, table.grid td { border: 1px solid #c5d3e0; padding: 5px 4px; text-align: left; font-size: 9px; white-space: nowrap; }
    table.grid th { background: #0B1B33; color: #fff; font-size: 8px; letter-spacing: 0.02em; text-transform: uppercase; }
    table.grid tr { page-break-inside: avoid; }
    table.grid thead { display: table-header-group; }
  </style>
</head>
<body>
  <table class="letter">
    <tr>
      <td style="width:52px;"><img class="logo" src="${TRAIN_LOGO}" alt="KSP Goods Shed" /></td>
      <td>
        <div class="name">${escapeHtml(APP_NAME)}</div>
        <div class="sub">RAILWAY GOODS OFFICE</div>
      </td>
    </tr>
  </table>
  <div class="rule"></div>
  <div class="doc">REPORT</div>
  <table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`;
}

async function createPdf(report) {
  const file = await pdfFromHtml(reportHtml(report), LANDSCAPE);
  return file.uri;
}

export async function printReport(report) {
  await printHtml(reportHtml(report), LANDSCAPE);
}

export async function shareReport(report) {
  const uri = await createPdf(report);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Report', UTI: 'com.adobe.pdf' });
}

export async function downloadReport(report) {
  const uri = await createPdf(report);
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) throw new Error('Choose a folder, such as Downloads, to save the report.');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const name = `KSP-${String(report.label || 'report').replace(/[^\w.-]+/g, '-')}`;
  const target = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, name, 'application/pdf');
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}
