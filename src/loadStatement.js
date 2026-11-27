function text(value) {
  return value === 0 || value ? String(value) : '—';
}

export function loadSlip(truck) {
  const selected = (truck.sets || []).find((set) => String(set.setNo) === String(truck.load?.setNo));
  const wagon = (selected?.wagons || []).find((item) => item.id === truck.load?.wagonId) || null;
  return {
    sno: text(truck.sno),
    trip: text(truck.trip ? `Trip ${truck.trip}` : 'Trip 1'),
    date: text(truck.date),
    truckNo: text(truck.truckNo),
    bags: text(truck.load?.bags),
    deliveryTo: text(truck.deliveryTo),
    setNo: text(truck.load?.setNo),
    commodity: text(truck.commodity),
    partyName: text(truck.partyName),
    rrNo: text(truck.rrNo),
    rrDate: text(truck.rrDate),
    fnr: text(truck.fnr),
    stationFrom: text(truck.stationFrom),
    stationTo: text(truck.stationTo),
    totalBags: text(wagon?.articleCount),
    wagonNo: text(truck.load?.wagonNo),
    balanceBags: text(wagon?.balanceBags),
  };
}
