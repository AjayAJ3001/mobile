import { APP_NAME } from './brand';
import { PRINT_LOGO } from './printLogo';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function fieldRows(fields) {
  const rows = [];
  for (let index = 0; index < fields.length; index += 2) {
    const pair = fields.slice(index, index + 2);
    const cells = pair.map(([label, value]) => `
      <td>
        <span class="k">${escapeHtml(label)}</span>
        <span class="v">${escapeHtml(value || '—')}</span>
      </td>`).join('');
    rows.push(`<tr>${cells}${pair.length === 1 ? '<td></td>' : ''}</tr>`);
  }
  return rows.join('');
}

export function statementDocument({ title, reference, fields = [], body = '' }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(APP_NAME)} — ${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm 14mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #122033; margin: 0; }
    .head { width: 100%; border-collapse: collapse; }
    .head td { vertical-align: middle; border: 0; padding: 0; }
    .logo { width: 72px; height: 72px; }
    .name { font-size: 22px; font-weight: 800; letter-spacing: 0.12em; color: #0B1B33; }
    .sub { margin-top: 4px; font-size: 11px; letter-spacing: 0.16em; font-weight: 700; color: #8a6424; }
    .rule { height: 4px; background: #0B1B33; border-bottom: 4px solid #E0A020; margin: 10px 0 14px; }
    .doc { text-align: center; font-size: 13px; letter-spacing: 0.22em; font-weight: 800; color: #0f6e8c; }
    .ref { text-align: center; font-size: 20px; font-weight: 800; margin: 4px 0 16px; }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .meta td { width: 50%; vertical-align: top; padding: 8px 10px; border: 1px solid #d5e1ec; }
    .k { display: block; font-size: 10px; color: #5d6d7e; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .v { display: block; font-size: 14px; font-weight: 700; margin-top: 3px; }
    h2 { margin: 16px 0 6px; font-size: 16px; color: #0B1B33; }
    p { margin: 4px 0; font-size: 14px; }
    table.data { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.data th, table.data td { border: 1px solid #d5e1ec; padding: 7px 8px; text-align: left; font-size: 12px; }
    table.data th { background: #0B1B33; color: #ffffff; }
    table.data tr { page-break-inside: avoid; }
    .foot { margin-top: 22px; border-top: 1px solid #d5e1ec; padding-top: 8px; text-align: center; font-size: 10px; letter-spacing: 0.08em; color: #5d6d7e; }
  </style>
</head>
<body>
  <table class="head">
    <tr>
      <td style="width: 84px;"><img class="logo" src="${PRINT_LOGO}" alt="KSP Goods Shed" /></td>
      <td>
        <div class="name">${escapeHtml(APP_NAME)}</div>
        <div class="sub">RAILWAY GOODS OFFICE</div>
      </td>
    </tr>
  </table>
  <div class="rule"></div>
  <div class="doc">${escapeHtml(title)}</div>
  ${reference ? `<div class="ref">${escapeHtml(reference)}</div>` : ''}
  ${fields.length ? `<table class="meta">${fieldRows(fields)}</table>` : ''}
  ${body}
  <div class="foot">${escapeHtml(APP_NAME)}</div>
</body>
</html>`;
}
