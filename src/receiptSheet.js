import { escapeHtml, statementDocument } from './statementHtml';

function groupsFor(wagons) {
  const grouped = new Map();
  for (const wagon of wagons || []) {
    const setNo = String(wagon.shedNo || '').trim() || '—';
    if (!grouped.has(setNo)) grouped.set(setNo, []);
    grouped.get(setNo).push(wagon);
  }
  return [...grouped.entries()].sort(([a], [b]) => Number(a) - Number(b));
}

export function receiptHtml(receipt) {
  const sections = groupsFor(receipt.wagons).map(([setNo, wagons]) => `
    <h2>Set no: ${escapeHtml(setNo)}</h2>
    <p>Total bags: ${escapeHtml((receipt.sets || []).find((set) => String(set.setNo) === String(setNo))?.totalBags ?? wagons.reduce((sum, wagon) => sum + Number(wagon.articleCount || 0), 0))}</p>
    <p>Balance bags: ${escapeHtml((receipt.sets || []).find((set) => String(set.setNo) === String(setNo))?.balanceBags ?? wagons.reduce((sum, wagon) => sum + Number(wagon.articleCount || 0), 0))}</p>
    <table class="data">
      <thead>
        <tr>
          <th>S.no</th>
          <th>Owning Rly</th>
          <th>Type</th>
          <th>Wagon No</th>
          <th>No. of Article</th>
        </tr>
      </thead>
      <tbody>
        ${wagons.map((wagon) => `
          <tr>
            <td>${escapeHtml(wagon.sno)}</td>
            <td>${escapeHtml(wagon.owningRly)}</td>
            <td>${escapeHtml(wagon.wagonType)}</td>
            <td>${escapeHtml(wagon.wagonNo)}</td>
            <td>${escapeHtml(wagon.articleCount)} bags</td>
          </tr>`).join('')}
      </tbody>
    </table>`).join('');

  return statementDocument({
    title: 'RAILWAY RECEIPT',
    reference: `RR ${receipt.rrNo}`,
    fields: [
      ['RR No', receipt.rrNo],
      ['RR Date', receipt.rrDate],
      ['Station From', receipt.stationFrom],
      ['Station To', receipt.stationTo],
      ['FNR', receipt.fnr],
      ['Commodity', receipt.commodityDescription],
      ['Party name', receipt.partyName],
    ],
    body: sections,
  });
}
