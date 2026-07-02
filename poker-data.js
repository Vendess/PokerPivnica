// ============================================================
// NAČÍTANIE DÁT Z GOOGLE SHEETS
// ============================================================
// 1. Vytvor Google Sheet so stĺpcami:
//    date | pot | p1_name | p1_prize | p2_name | p2_prize | p3_name | p3_prize
// 2. Súbor -> Zdieľať -> Publikovať na webe -> formát CSV
// 3. Skopíruj odkaz a vlož ho nižšie do SHEET_CSV_URL
// ============================================================

const SHEET_CSV_URL = "PASTE_YOUR_PUBLISHED_CSV_LINK_HERE";

// Zistí, či Google Sheets exportoval CSV s čiarkou alebo bodkočiarkou ako oddeľovačom
// (slovenská lokalizácia zvyčajne používa bodkočiarku, lebo čiarka je desatinná bodka)
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

// Jednoduchý CSV parser, zvláda aj úvodzovky okolo hodnôt s oddeľovačom
function parseCSV(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === delimiter) { row.push(field); field = ""; }
      else if (char === '\n' || char === '\r') {
        if (field.length || row.length) { row.push(field); rows.push(row); }
        row = []; field = "";
        if (char === '\r' && next === '\n') i++;
      } else { field += char; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ""));
}

// Prevedie textovú hodnotu čísla na Number, akceptuje aj desatinnú čiarku (napr. "25,5")
function parseNumber(raw) {
  if (raw === undefined || raw === null) return 0;
  const cleaned = raw.trim().replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// Prijíma dátum vo formáte dd.mm.rrrr (napr. "26.6.2026" alebo "26.06.2026")
// a vracia { display, sortKey } - display sa zobrazuje, sortKey (ISO) sa používa na zoradenie
function parseSkDate(raw) {
  const cleaned = raw.trim();
  const match = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return { display: cleaned, sortKey: cleaned };

  const [, d, m, y] = match;
  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");
  return { display: `${dd}.${mm}.${y}`, sortKey: `${y}-${mm}-${dd}` };
}

function rowsToWeeks(rows) {
  const [header, ...body] = rows;
  const idx = name => header.findIndex(h => h.trim().toLowerCase() === name);

  const iDate = idx("date"), iPot = idx("pot");
  const i1n = idx("p1_name"), i1p = idx("p1_prize");
  const i2n = idx("p2_name"), i2p = idx("p2_prize");
  const i3n = idx("p3_name"), i3p = idx("p3_prize");

  return body.map(r => {
    const { display, sortKey } = parseSkDate(r[iDate] || "");
    return {
      date: display,
      sortKey,
      pot: parseNumber(r[iPot]),
      results: [
        { place: 1, name: r[i1n]?.trim(), prize: parseNumber(r[i1p]) },
        { place: 2, name: r[i2n]?.trim(), prize: parseNumber(r[i2p]) },
        { place: 3, name: r[i3n]?.trim(), prize: parseNumber(r[i3p]) }
      ].filter(p => p.name)
    };
  }).filter(w => w.date);
}

// Vráti Promise, ktorý sa vyrieši na pole "weeks" v rovnakom tvare ako predtým data.js
function loadWeeks() {
  return fetch(SHEET_CSV_URL, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Nepodarilo sa načítať dáta zo Sheetu (status " + res.status + ")");
      return res.text();
    })
    .then(text => {
      const clean = text.replace(/^\uFEFF/, ""); // odstráni BOM znak, ak je prítomný
      const delimiter = detectDelimiter(clean);
      return rowsToWeeks(parseCSV(clean, delimiter));
    });
}
