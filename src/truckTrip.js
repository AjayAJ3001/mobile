export function calcTruckTrip(truck, allTrucks = []) {
  if (!truck) return 1;
  const targetNo = String(truck.truckNo || '').trim().toUpperCase();
  if (!targetNo) return Number(truck.trip) || 1;

  const same = (allTrucks || []).filter((t) => {
    const sameNo = String(t.truckNo || '').trim().toUpperCase() === targetNo;
    if (!sameNo) return false;
    if (truck.receiptId && t.receiptId) return t.receiptId === truck.receiptId;
    if (truck.rrNo && t.rrNo) return t.rrNo === truck.rrNo;
    return true;
  });

  if (same.length > 1) {
    same.sort((a, b) => (Number(a.sno) || 0) - (Number(b.sno) || 0) || (Number(a.id) || 0) - (Number(b.id) || 0));
    const index = same.findIndex((t) => (t.id && truck.id && t.id === truck.id) || (t.sno && truck.sno && t.sno === truck.sno));
    if (index >= 0) return index + 1;
  }

  return Number(truck.trip) || 1;
}
