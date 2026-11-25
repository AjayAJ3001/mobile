function field(label, value) {
  return { label, value: value === 0 || value ? value : '—' };
}

export function reportRows(item) {
  return [
    { left: [field('S.no', item.sno)], right: [field('Vehicle no', item.truckNo)] },
    { left: [field('Party name', item.partyName)], right: [field('Bags', item.bags)] },
    { left: [field('RR No', item.rrNo), field('RR Date', item.rrDate)], right: [field('Delivery to', item.deliveryTo)] },
    { left: [field('FNR', item.fnr)], right: [field('Set no', item.setNo)] },
    { left: [field('Station from', item.stationFrom), field('Station to', item.stationTo)], right: [field('Commodity', item.commodity)] },
    { left: [field('Total bags', item.totalBags)], right: [] },
    { left: [field('Wagon no', item.wagonNo)], right: [] },
    { left: [field('Balance bags', item.balanceBags)], right: [] },
  ];
}

export function reportDate(item) {
  return item.date || '—';
}

export function reportFields(item) {
  return [
    ['Serial no', item.sno],
    ['Truck number', item.truckNo],
    ['RR No', item.rrNo],
    ['RR Date', item.rrDate],
    ['FNR', item.fnr],
    ['Date', item.date],
    ['Station From', item.stationFrom],
    ['Station To', item.stationTo],
    ['Commodity', item.commodity],
    ['Party name', item.partyName],
    ['Delivery to', item.deliveryTo],
    ['Bags', item.bags],
    ['Set no', item.setNo],
    ['Total bags', item.totalBags],
    ['Balance bags', item.balanceBags],
  ];
}

export const REPORT_MODES = [
  { id: 'rr', label: 'RR No' },
  { id: 'truck', label: 'Truck' },
  { id: 'set', label: 'Set' },
  { id: 'bags', label: 'Bags' },
  { id: 'date', label: 'Date' },
];

function keyFor(row, mode) {
  if (mode === 'truck') return row.truckNo;
  if (mode === 'set') return `Set ${row.setNo}`;
  if (mode === 'bags') return `${row.bags} bags`;
  if (mode === 'date') return row.date;
  return `RR ${row.rrNo}`;
}

function stamp(value) {
  const [day, month, year] = String(value || '').split('-');
  if (!year || !month || !day) return 0;
  return Number(year) * 10000 + Number(month) * 100 + Number(day);
}

function fieldFor(row, mode) {
  if (mode === 'truck') return row.truckNo;
  if (mode === 'set') return String(row.setNo);
  if (mode === 'bags') return String(row.bags);
  if (mode === 'date') return row.date;
  return row.rrNo;
}

export function reportChoices(rows, mode) {
  const values = [...new Set((rows || []).map((row) => fieldFor(row, mode)).filter(Boolean))];
  if (mode === 'set' || mode === 'bags') return values.sort((a, b) => Number(a) - Number(b));
  if (mode === 'date') return values.sort((a, b) => stamp(a) - stamp(b));
  return values.sort();
}

function matches(row, mode, filter) {
  if (mode === 'date') {
    const day = stamp(row.date);
    if (filter.from && day < stamp(filter.from)) return false;
    if (filter.to && day > stamp(filter.to)) return false;
    return true;
  }
  if (!filter.value) return true;
  return fieldFor(row, mode) === String(filter.value);
}

export function buildReport(rows, mode, filter = {}) {
  const filtered = (rows || []).filter((row) => matches(row, mode, filter));
  const grouped = new Map();
  for (const row of filtered) {
    const key = keyFor(row, mode);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  const groups = [...grouped.entries()].map(([title, items]) => ({
    title,
    items,
    trucks: items.length,
    bags: items.reduce((sum, item) => sum + Number(item.bags || 0), 0),
  }));
  return {
    mode,
    label: REPORT_MODES.find((item) => item.id === mode)?.label || 'RR No',
    groups,
    trucksGone: groups.reduce((sum, group) => sum + group.trucks, 0),
    totalBags: groups.reduce((sum, group) => sum + group.bags, 0),
  };
}
