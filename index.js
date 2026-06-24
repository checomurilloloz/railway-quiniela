const https = require("https");

function fetchURL(url, headers) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.request({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: "GET",
      headers: { "Accept": "application/json", ...headers }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.end();
  });
}

// Cache odds for 5 minutes to save API calls
let oddsCache = { data: null, ts: 0 };

require("http").createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  // ── /matches ──────────────────────────────────────────────────────────────
  if (req.url === "/matches") {
    try {
      const r = await fetchURL(
        "https://api.football-data.org/v4/competitions/WC/matches",
        { "X-Auth-Token": "3f7c694c00a2428a877a06603175aeea" }
      );
      res.writeHead(200);
      return res.end(r.body);
    } catch(e) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ── /odds ─────────────────────────────────────────────────────────────────
  if (req.url === "/odds") {
    try {
      const now = Date.now();
      // Use cache if less than 5 minutes old
      if (oddsCache.data && (now - oddsCache.ts) < 5 * 60 * 1000) {
        res.writeHead(200);
        return res.end(oddsCache.data);
      }

      const r = await fetchURL(
        "https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/" +
        "?apiKey=8f6017a9f30a7c82fdf329b914bf026b" +
        "&regions=us&markets=h2h&oddsFormat=decimal&dateFormat=iso",
        {}
      );

      if (r.status === 200) {
        oddsCache = { data: r.body, ts: now };
        res.writeHead(200);
        return res.end(r.body);
      }
      throw new Error("Odds API returned " + r.status + ": " + r.body);
    } catch(e) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));

}).listen(process.env.PORT || 3000, () => console.log("Server running"));
