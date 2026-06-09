const https = require("https");

const API_KEY = "3f7c694c00a2428a877a06603175aeea";

require("http").createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.url !== "/matches") {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  const options = {
    hostname: "api.football-data.org",
    path: "/v4/competitions/WC/matches",
    headers: { "X-Auth-Token": API_KEY }
  };

  https.get(options, (apiRes) => {
    let data = "";
    apiRes.on("data", chunk => data += chunk);
    apiRes.on("end", () => {
      res.writeHead(200);
      res.end(data);
    });
  }).on("error", e => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  });

}).listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
