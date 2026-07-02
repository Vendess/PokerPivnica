// ============================================================
// VÝSLEDKY POKEROVÝCH VEČEROV
// ============================================================
// Každý týždeň sem pridaj nový objekt do poľa "weeks".
// Poradie v poli nie je dôležité - stránka si ich zoradí
// podľa dátumu automaticky (najnovší večer hore).
//
// date  - dátum vo formáte "YYYY-MM-DD"
// pot   - celková suma v banku daný večer (číslo, bez € znaku)
// results - pole troch objektov (place: 1, 2, 3)
//   name  - meno hráča
//   prize - výhra v eurách (číslo)
// ============================================================

const weeks = [
  {
    date: "2026-06-26",
    pot: 45,
    results: [
      { place: 1, name: "Tomáš", prize: 25 },
      { place: 2, name: "Miro",  prize: 15 },
      { place: 3, name: "Peťo",  prize: 5 }
    ]
  },
  {
    date: "2026-06-19",
    pot: 40,
    results: [
      { place: 1, name: "Miro",  prize: 22 },
      { place: 2, name: "Sam",   prize: 13 },
      { place: 3, name: "Tomáš", prize: 5 }
    ]
  },
  {
    date: "2026-06-12",
    pot: 50,
    results: [
      { place: 1, name: "Peťo",  prize: 28 },
      { place: 2, name: "Tomáš", prize: 16 },
      { place: 3, name: "Miro",  prize: 6 }
    ]
  }
];
