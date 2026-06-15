import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ai from './api/ai.js';
import brave from './api/brave.js';
import health from './api/health.js';
import taobao from './api/taobao.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);

const apiRoutes = {
  '/api/ai': ai,
  '/api/brave': brave,
  '/api/health': health,
  '/api/taobao': taobao
};

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function enhanceRes(res) {
  res.status = code => {
    res.statusCode = code;
    return res;
  };
  res.send = body => {
    res.end(body);
  };
  return res;
}

async function serveStatic(req, res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const fullPath = path.resolve(__dirname, relative);

  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(fullPath);
    res.writeHead(200, { 'Content-Type': mime[path.extname(fullPath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = apiRoutes[url.pathname];

  try {
    if (handler) {
      req.query = Object.fromEntries(url.searchParams.entries());
      await handler(req, enhanceRes(res));
      return;
    }

    await serveStatic(req, res, url.pathname);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Fashion Agent preview: http://localhost:${port}`);
});
