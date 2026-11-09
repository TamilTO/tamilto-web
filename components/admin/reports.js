'use client'
// Report downloads for the admin: real Excel files (.xlsx) and print-ready PDF pages.
import { zipSync, strToU8 } from 'fflate'

const x = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
const col = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26) } return s }

function sheetXml(rows) {
  const widths = []
  rows.forEach((r) => r.forEach((c, i) => { widths[i] = Math.min(60, Math.max(widths[i] || 8, String(c ?? '').length + 2)) }))
  const body = rows.map((r, ri) => {
    // Bold the title row and every row that starts a new table (the row after a blank one).
    const bold = ri === 0 || (ri > 0 && !rows[ri - 1].length)
    const cells = r.map((c, ci) => {
      const ref = col(ci) + (ri + 1)
      const s = bold ? ' s="1"' : ''
      if (typeof c === 'number' && isFinite(c)) return `<c r="${ref}"${s}><v>${c}</v></c>`
      if (c === '' || c == null) return ''
      return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${x(c)}</t></is></c>`
    }).join('')
    return `<row r="${ri + 1}">${cells}</row>`
  }).join('')
  const cols = widths.length ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${body}</sheetData></worksheet>`
}

/** Download an Excel file. `sheets` = [{ name, rows: [[cell, ...], ...] }]. Empty rows separate tables. */
export function downloadXlsx(filename, sheets) {
  const names = sheets.map((s, i) => (String(s.name || 'Sheet' + (i + 1)).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet' + (i + 1)))
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${x(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
  }
  sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s.rows) })
  const zip = zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])), { level: 6 })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  a.download = filename.endsWith('.xlsx') ? filename : filename + '.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// ---------- PDF (print-ready page; the browser saves it as PDF) ----------
const esc = x
export const nf = (n) => Number(n || 0).toLocaleString('en-CA')
const DISPLAY = "'Big Shoulders Variable','Arial Narrow',Arial,sans-serif"

export function printDoc(title, body) {
  const f = document.createElement('iframe')
  f.setAttribute('aria-hidden', 'true')
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(f)
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => `<link rel="stylesheet" href="${esc(l.href)}">`).join('')
  const d = f.contentDocument
  d.open()
  d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${links}<style>@page{size:A4;margin:14mm}html,body{background:#fff!important;color:#1A1410!important}body{margin:0;font-family:'Hanken Grotesk Variable',Arial,sans-serif;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}table{border-collapse:collapse;width:100%}td,th{padding:5px 6px;border-bottom:1px solid #E6DDD0;text-align:left}th{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5B4F44}.avoid{break-inside:avoid}</style></head><body>${body}</body></html>`)
  d.close()
  setTimeout(() => {
    try { f.contentWindow.focus(); f.contentWindow.print() } catch {}
    setTimeout(() => f.remove(), 60000)
  }, 900)
}
export const pdfHead = (kicker, title, meta) =>
  `<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #B3122E;padding-bottom:10px;margin-bottom:16px"><div style="font-family:${DISPLAY};font-weight:900;font-size:34px;line-height:1">Tamil<span style="color:#B3122E">TO</span></div><div style="text-align:right;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5B4F44">${esc(kicker)}</div></div><div style="font-family:${DISPLAY};font-weight:900;font-size:38px;line-height:1;margin-bottom:4px">${esc(title)}</div><div style="color:#5B4F44;margin-bottom:16px">${esc(meta)}</div>`
export const pdfCards = (cards) =>
  `<div class="avoid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">${cards.map((c) => `<div style="border:1px solid #E6DDD0;border-radius:10px;padding:10px"><div style="font-size:10px;font-weight:800;color:#5B4F44">${esc(c.l)}</div><div style="font-family:${DISPLAY};font-weight:900;font-size:28px;line-height:1.1">${esc(c.v)}</div><div style="font-size:10px;color:#5B4F44">${esc(c.d || '')}</div></div>`).join('')}</div>`
export const pdfBars = (title, bars, bars2) => {
  const mx = Math.max(1, ...bars.map((b) => b.v))
  return `<div class="avoid"><div style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5B4F44;margin-bottom:6px">${esc(title)}</div><div style="display:flex;align-items:flex-end;gap:2px;height:110px;border-bottom:1px solid #E6DDD0;margin-bottom:4px">${bars.map((b, i) => `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><div style="background:#F0A202;border-radius:2px 2px 0 0;height:${Math.max(1, Math.round((b.v / mx) * 100))}%;display:flex;flex-direction:column;justify-content:flex-end">${bars2 ? `<div style="background:#1F7A4D;height:${b.v ? Math.round(((bars2[i] || 0) / b.v) * 100) : 0}%"></div>` : ''}</div></div>`).join('')}</div><div style="display:flex;justify-content:space-between;font-size:9px;color:#5B4F44;margin-bottom:16px"><span>${esc(bars[0] ? bars[0].d : '')}</span>${bars2 ? '<span><span style="color:#F0A202">■</span> views <span style="color:#1F7A4D">■</span> contacts</span>' : ''}<span>${esc(bars.length ? bars[bars.length - 1].d : '')}</span></div></div>`
}
export const pdfTable = (title, head, rows) =>
  `<div class="avoid"><div style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5B4F44;margin:4px 0 6px">${esc(title)}</div><table style="margin-bottom:16px"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' style="text-align:right;font-weight:600"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}" style="color:#5B4F44">Nothing in this period.</td></tr>`}</tbody></table></div>`
export const pdfFoot = () =>
  `<div style="margin-top:18px;padding-top:8px;border-top:1px solid #E6DDD0;font-size:10px;color:#5B4F44">Generated ${esc(new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }))} · TamilTO · tamilto.com · Counts come from tamilto.com and include no personal information.</div>`
