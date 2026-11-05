const http = require('http');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const routes = [
  '/',
  '/movies',
  '/tv',
  '/anime',
  '/kdramas',
];

function measure(path) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({ path, statusCode: res.statusCode, duration, size: body.length });
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout on ${path}`));
    });
  });
}

async function run() {
  console.log(`\n⚡ Running Latency Benchmark on ${BASE_URL}...\n`);
  
  // Cold run
  console.log('--- COLD REQUESTS (First Load) ---');
  for (const r of routes) {
    try {
      const res = await measure(r);
      console.log(`  ${r.padEnd(12)} -> ${res.statusCode} | ${res.duration}ms | ${(res.size / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.log(`  ${r.padEnd(12)} -> FAILED: ${err.message}`);
    }
  }

  // Warm run (Cached in-memory Map layer + Fast Circuit Breaker)
  console.log('\n--- WARM REQUESTS (In-Memory Fast Cache Layer) ---');
  for (const r of routes) {
    try {
      const res = await measure(r);
      console.log(`  ${r.padEnd(12)} -> ${res.statusCode} | ${res.duration}ms | ${(res.size / 1024).toFixed(1)} KB [FAST CACHE HIT]`);
    } catch (err) {
      console.log(`  ${r.padEnd(12)} -> FAILED: ${err.message}`);
    }
  }
}

run();

