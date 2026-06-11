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

require("http").createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/matches") {
    try {
      // Try worldcup26.ir first (free, no key)
      const r = await fetchURL("https://worldcup26.ir/get/games", {});
      if (r.status === 200) {
        res.writeHead(200);
        return res.end(r.body);
      }
      throw new Error("worldcup26.ir returned " + r.status);
    } catch(e1) {
      // Fallback to football-data.org
      try {
        const r2 = await fetchURL(
          "https://api.football-data.org/v4/competitions/WC/matches",
          { "X-Auth-Token": "3f7c694c00a2428a877a06603175aeea" }
        );
        res.writeHead(200);
        return res.end(r2.body);
      } catch(e2) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: e1.message + " | " + e2.message }));
      }
    }
  }

  if (req.url === "/odds") {
    // Polymarket odds for World Cup matches - static fallback with real pre-match odds
    res.writeHead(200);
    return res.end(JSON.stringify({ source: "static" }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
}).listen(process.env.PORT || 3000, () => console.log("Server running"));
