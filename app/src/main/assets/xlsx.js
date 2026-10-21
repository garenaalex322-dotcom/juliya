// Мини-генератор файлов Excel (.xlsx) без сторонних библиотек.
// Несколько листов, настоящие числа и даты, жирная шапка, закреплённая первая строка и фильтр по столбцам.
// Архив собирается без сжатия — Excel, Google Таблицы, «Числа» и LibreOffice открывают такие файлы.
const XLSX_MINI = (() => {
  'use strict';
  const enc = new TextEncoder();

  /* ---------- ZIP без сжатия ---------- */
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const u16 = v => [v & 255, (v >>> 8) & 255];
  const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  function zip(files) {
    const now = new Date();
    const tm = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dt = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [], central = [];
    let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data), sz = data.length;
      const head = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(tm), ...u16(dt), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(name.length), ...u16(0)]);
      parts.push(head, name, data);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(tm), ...u16(dt), ...u32(crc), ...u32(sz), ...u32(sz),
        ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
      off += head.length + name.length + sz;
    }
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), ...u16(0)]);
    const all = parts.concat(central, [end]), out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
    let p = 0;
    for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  /* ---------- листы ---------- */
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', NSR = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const esc = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  // дата 'ГГГГ-ММ-ДД' → номер дня в Excel
  const serial = k => { const [y, m, d] = String(k).split('-').map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; };
  const sheetName = s => String(s).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31) || 'Лист';
  // стили ячеек (см. styles.xml): 0 обычный, 1 шапка, 2 дата, 3 целое, 4 одна цифра после запятой, 5 проценты, 6 текст с переносом
  const STY = { date: 2, int: 3, num1: 4, pct: 5, wrap: 6 };

  function sheetXml(sh) {
    const cols = sh.cols, last = colName(cols.length - 1) + (sh.rows.length + 1);
    let x = HEAD + `<worksheet xmlns="${NS}" xmlns:r="${NSR}">`;
    x += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/></sheetView></sheetViews>';
    x += '<sheetFormatPr defaultRowHeight="15"/><cols>' + cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.w || 12}" customWidth="1"/>`).join('') + '</cols><sheetData>';
    x += '<row r="1" ht="32" customHeight="1">' + cols.map((c, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${esc(c.h)}</t></is></c>`).join('') + '</row>';
    sh.rows.forEach((row, ri) => {
      const r = ri + 2;
      let cells = '';
      row.forEach((v, ci) => {
        if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return;
        const ref = colName(ci) + r, t = (cols[ci] && cols[ci].t) || '';
        if (t === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) cells += `<c r="${ref}" s="2"><v>${serial(v)}</v></c>`;
        else if (typeof v === 'number') cells += `<c r="${ref}"${STY[t] ? ` s="${STY[t]}"` : ''}><v>${t === 'int' ? Math.round(v) : +v.toFixed(4)}</v></c>`;
        else cells += `<c r="${ref}" t="inlineStr"${t === 'wrap' ? ' s="6"' : ''}><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
      });
      x += `<row r="${r}">${cells}</row>`;
    });
    x += '</sheetData>';
    if (sh.rows.length && sh.filter !== false) x += `<autoFilter ref="A1:${last}"/>`;
    x += '<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
    return x;
  }

  const STYLES = HEAD + `<styleSheet xmlns="${NS}">` +
    '<numFmts count="2"><numFmt numFmtId="164" formatCode="dd.mm.yyyy"/><numFmt numFmtId="165" formatCode="0.0"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF3E6EC"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="7">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  // sheets: [{ name, cols: [{ h: 'Заголовок', w: ширина, t: 'date'|'int'|'num1'|'pct'|'wrap'|'' }], rows: [[...], ...], filter?: false }]
  function build(sheets) {
    const n = sheets.length, names = sheets.map(s => sheetName(s.name));
    const files = [];
    files.push({ name: '[Content_Types].xml', data: HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>' });
    files.push({ name: '_rels/.rels', data: HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
    const filt = sheets.map((s, i) => s.rows.length && s.filter !== false
      ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${esc(names[i].replace(/'/g, "''"))}'!$A$1:$${colName(s.cols.length - 1)}$${s.rows.length + 1}</definedName>` : '').join('');
    files.push({ name: 'xl/workbook.xml', data: HEAD + `<workbook xmlns="${NS}" xmlns:r="${NSR}"><bookViews><workbookView/></bookViews><sheets>` +
      names.map((nm, i) => `<sheet name="${esc(nm)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' +
      (filt ? `<definedNames>${filt}</definedNames>` : '') + '</workbook>' });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
      `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` });
    files.push({ name: 'xl/styles.xml', data: STYLES });
    sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) }));
    return zip(files);
  }

  return { build, MIME: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
})();
