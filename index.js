const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const fetch = require('node-fetch');

let priceData = [];

async function loadHistory() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily');
    const json = await res.json();
    priceData = json.prices.map(([ts, price]) => ({ x: new Date(ts).toISOString(), y: price }));
  } catch (e) { console.error('History load failed'); }
}
loadHistory();

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  if (req.url === '/history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(priceData));
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      let contentType = 'text/html';
      if (filePath.endsWith('.css')) contentType = 'text/css';
      if (filePath.endsWith('.js')) contentType = 'text/javascript';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

const wss = new WebSocket.Server({ server });

async function broadcast() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const json = await res.json();
    const point = { x: new Date().toISOString(), y: json.bitcoin.usd };
    wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify(point)));
  } catch (e) {}
}

setInterval(broadcast, 15000);
broadcast();

server.listen(3000, () => console.log('Running - / and /vitamins.html both work'));
