import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { loadSlip } from './loadStatement';
import { pdfFromHtml, printHtml, RECEIPT_3IN } from './printPage';
import { escapeHtml } from './statementHtml';

function show(value) {
  return escapeHtml(value || '—');
}

function loadHtml(truck) {
  const slip = loadSlip(truck);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Load ${show(slip.truckNo)}</title>
  <style>
    @page { size: 76.2mm 120mm; margin: 0; }
    * { box-sizing: border-box; }
    body { width: 76.2mm; margin: 0; padding: 3mm 3mm 4mm; font-family: Arial, Helvetica, sans-serif; color: #000; }
    .brand { text-align: center; font-size: 18px; font-weight: 800; letter-spacing: 0.16em; }
    .place { text-align: center; font-size: 11px; font-weight: 700; margin-top: 2px; }
    .line { border-top: 1px solid #000; margin: 6px 0; }
    .meta { display: flex; align-items: center; font-size: 10px; font-weight: 700; }
    .meta span { flex: 1; }
    .mid { text-align: center; }
    .end { text-align: right; }
    .truck { text-align: center; font-size: 18px; font-weight: 800; letter-spacing: 0.04em; margin: 4px 0 2px; }
    .row, .pair { display: flex; justify-content: space-between; gap: 6px; padding: 2px 0; font-size: 11px; }
    .row span:first-child { flex: none; }
    .row b, .pair b { flex: 1; min-width: 0; font-weight: 800; text-align: right; word-break: break-word; }
    .pair span { flex: 1; min-width: 0; }
    .pair span.end { text-align: right; }
    .auth { margin-top: 16px; text-align: center; }
    .sign { width: 46mm; margin: 0 auto 4px; border-top: 1px solid #000; }
    .fnr { font-size: 11px; font-weight: 700; padding: 2px 0; }
    .fnr b { font-weight: 800; }
    .who { font-size: 11px; font-weight: 800; letter-spacing: 0.04em; }
  </style>
</head>
<body>
  <div class="brand">KSP</div>
  <div class="place">Railway Goods Shed Erode</div>
  <div class="line"></div>
  <div class="meta">
    <span>S.No ${show(slip.sno)}</span>
    <span class="mid">Load Entry</span>
    <span class="end">${show(slip.date)}</span>
  </div>
  <div class="line"></div>
  <div class="truck">${show(slip.truckNo)}</div>
  <div class="row"><span>Bags :</span><b>${show(slip.bags)}</b></div>
  <div class="row"><span>Delivery to :</span><b>${show(slip.deliveryTo)}</b></div>
  <div class="row"><span>Set No :</span><b>${show(slip.setNo)}</b></div>
  <div class="row"><span>Commodity :</span><b>${show(slip.commodity)}</b></div>
  <div class="row"><span>Party Name :</span><b>${show(slip.partyName)}</b></div>
  <div class="line"></div>
  <div class="pair"><span>RR No : <b>${show(slip.rrNo)}</b></span><span class="end">RR Date : <b>${show(slip.rrDate)}</b></span></div>
  <div class="fnr">FNR : <b>${show(slip.fnr)}</b></div>
  <div class="pair"><span>From : <b>${show(slip.stationFrom)}</b></span><span class="end">To : <b>${show(slip.stationTo)}</b></span></div>
  <div class="pair"><span>Total Bags : <b>${show(slip.totalBags)}</b></span><span class="end">Wagon : <b>${show(slip.wagonNo)}</b></span></div>
  <div class="row"><span>Balance Bags :</span><b>${show(slip.balanceBags)}</b></div>
  <div class="auth">
    <div class="sign"></div>
    <div class="who">KSP Authorised</div>
  </div>
</body>
</html>`;
}

async function createPdf(truck) {
  const file = await pdfFromHtml(loadHtml(truck), RECEIPT_3IN);
  return file.uri;
}

export async function printLoad(truck) {
  await printHtml(loadHtml(truck), RECEIPT_3IN);
}

export async function shareLoad(truck) {
  const uri = await createPdf(truck);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Load ${truck.truckNo}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function downloadLoad(truck) {
  const uri = await createPdf(truck);
  const filename = `Load-${truck.truckNo}.pdf`;
  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Choose a folder, such as Downloads, to save the load entry.');
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    filename.replace(/\.pdf$/i, ''),
    'application/pdf'
  );
  await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });
}
