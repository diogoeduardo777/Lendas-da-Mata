// ============================================================
// server.js - Servidor estático simples (Node puro, sem dependências)
// Uso: node server.js  ->  abre http://localhost:5178
// (Opcional: o jogo também roda abrindo o index.html direto no navegador.)
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5178;
const RAIZ = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const servidor = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  // Impede acesso a caminhos fora da raiz
  const arquivo = path.normalize(path.join(RAIZ, url));
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403); res.end('Proibido');
    return;
  }

  fs.readFile(arquivo, (err, dados) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo nao encontrado: ' + url);
      return;
    }
    const ext = path.extname(arquivo).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(dados);
  });
});

servidor.listen(PORT, () => {
  console.log(`Lendas da Mata rodando em http://localhost:${PORT}`);
});
