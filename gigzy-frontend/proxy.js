/**
 * CORS Proxy — handles preflight and forwards requests to Spring Boot.
 * Run: node proxy.js
 */
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const BACKEND = 'http://localhost:8080';
const PORT = 3001;

const app = express();

// RAW CORS — handle preflight, set headers on EVERY response
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:8081';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log(`✅ OPTIONS ${req.url} → 200 (preflight handled)`);
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON body so we can re-send it
app.use(express.json());

// Manual proxy — forward every non-OPTIONS request to backend
app.use('/', async (req, res) => {
  const http = require('http');
  const targetPath = req.originalUrl;
  const body = req.body ? JSON.stringify(req.body) : '';

  console.log(`➡️  ${req.method} ${targetPath}`);
  console.log(`   Auth: ${req.headers.authorization ? 'Bearer ***' : 'NONE'}`);

  const options = {
    hostname: 'localhost',
    port: 8080,
    path: targetPath,
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => data += chunk);
    proxyRes.on('end', () => {
      const icon = proxyRes.statusCode < 300 ? '✅' : '❌';
      console.log(`${icon} ${proxyRes.statusCode} ← ${req.method} ${targetPath}`);
      if (proxyRes.statusCode >= 400) {
        console.log(`   Response: ${data || '(empty)'}`);
      }

      // Set response headers
      const origin = req.headers.origin || 'http://localhost:8081';
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');

      res.status(proxyRes.statusCode);
      if (proxyRes.headers['content-type']) {
        res.header('Content-Type', proxyRes.headers['content-type']);
      }
      res.send(data);
    });
  });

  proxyReq.on('error', (err) => {
    console.error(`❌ Backend error: ${err.message}`);
    res.status(502).json({ error: 'Backend unreachable', message: err.message });
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
});

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`🚀 CORS Proxy: http://localhost:${PORT}`);
  console.log(`📡 Backend:    ${BACKEND}`);
  console.log('═══════════════════════════════════════');
  console.log('');
});
