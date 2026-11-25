export function expandedPartyName(parties, typed, previous = '') {
  const query = String(typed || '').trim().toLowerCase();
  const matches = (parties || []).filter((party) => party.name.toLowerCase().includes(query));
  const growing = String(typed).length >= String(previous).length;
  if (query.length >= 3 && matches.length === 1 && growing) return matches[0].name;
  return typed;
}

export function partyChoices(parties, typed) {
  const query = String(typed || '').trim().toLowerCase();
  if (!query) return [];
  return (parties || []).filter((party) => {
    const name = party.name.toLowerCase();
    return name.includes(query) && name !== query;
  });
}
