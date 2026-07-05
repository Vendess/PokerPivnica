// ============================================================
// CLOUDFLARE WORKER - Účasť na pokri (RSVP)
// ============================================================
// Tento súbor sa nasadzuje na Cloudflare Workers (nie na GitHub Pages).
// Vyžaduje KV namespace naviazaný pod menom "RSVP_KV".
// Postup nasadenia je v priloženom návode.
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/rsvp" && request.method === "GET") {
      const weekKey = getISOWeekKey(new Date());
      const list = await env.RSVP_KV.list({ prefix: `rsvp:${weekKey}:` });

      const entries = await Promise.all(
        list.keys.map(async (k) => {
          const val = await env.RSVP_KV.get(k.name);
          return val ? JSON.parse(val) : null;
        })
      );

      return new Response(
        JSON.stringify({ week: weekKey, entries: entries.filter(Boolean) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/rsvp" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Neplatný formát dát" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const name = (body.name || "").trim();
      if (!name) {
        return new Response(JSON.stringify({ error: "Meno je povinné" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (name.length > 40) {
        return new Response(JSON.stringify({ error: "Meno je príliš dlhé" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const weekKey = getISOWeekKey(new Date());
      const normalizedKey = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const key = `rsvp:${weekKey}:${normalizedKey}`;

      const value = {
        name,
        coming: !!body.coming,
        day: body.day === "stvrtok" ? "stvrtok" : "streda",
        note: (body.note || "").trim().slice(0, 200),
        updatedAt: new Date().toISOString(),
      };

      await env.RSVP_KV.put(key, JSON.stringify(value));

      return new Response(JSON.stringify({ ok: true, week: weekKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

// Vypočíta ISO týždeň (napr. "2026-W28") pre daný dátum.
// Vďaka tomu sa každý kalendárny týždeň dáta prirodzene "vynulujú".
function getISOWeekKey(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
