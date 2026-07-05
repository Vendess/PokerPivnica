// ============================================================
// KOMUNIKÁCIA S RSVP BACKENDOM (Cloudflare Worker)
// ============================================================
// Vlož sem URL svojho nasadeného Workera, napr:
// "https://poker-rsvp.tvoj-subdomain.workers.dev"
// ============================================================

const RSVP_API_URL = "PASTE_YOUR_WORKER_URL_HERE";

function fetchRsvps() {
  return fetch(`${RSVP_API_URL}/rsvp`, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Nepodarilo sa načítať odpovede (status " + res.status + ")");
      return res.json();
    });
}

function submitRsvp({ name, coming, day, note }) {
  return fetch(`${RSVP_API_URL}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, coming, day, note }),
  }).then(res => {
    if (!res.ok) {
      return res.json().then(data => {
        throw new Error(data.error || "Nepodarilo sa odoslať odpoveď");
      });
    }
    return res.json();
  });
}
