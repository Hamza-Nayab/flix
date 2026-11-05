const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const isProd = process.argv.includes('--prod');
// Filter out flags to get positional args
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const site = args[0] || 'roseflix';
const port = args[1] || (isProd ? '3000' : '3000');
const tenantEnvFile = path.resolve(process.cwd(), `.env.${site}.local`);
const localEnvFile = path.resolve(process.cwd(), '.env.local');
const backupEnvFile = path.resolve(process.cwd(), '.env.local.backup');

let didBackup = false;

// Function to cleanup/restore backup on exit
function cleanup() {
  if (didBackup && fs.existsSync(backupEnvFile)) {
    try {
      fs.copyFileSync(backupEnvFile, localEnvFile);
      fs.unlinkSync(backupEnvFile);
      didBackup = false;
    } catch (e) {
      console.error('Failed to restore .env.local backup:', e.message);
    }
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
process.on('exit', () => {
  cleanup();
});

// Load tenant env into process.env and synchronize into .env.local
if (fs.existsSync(tenantEnvFile)) {
  const tenantContent = fs.readFileSync(tenantEnvFile, 'utf8');

  // Backup existing .env.local if not already backed up
  if (fs.existsSync(localEnvFile) && !fs.existsSync(backupEnvFile)) {
    try {
      fs.copyFileSync(localEnvFile, backupEnvFile);
      didBackup = true;
    } catch (e) {
      console.warn('Could not backup .env.local:', e.message);
    }
  }

  // Parse tenant values
  const tenantVars = {};
  tenantContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
      tenantVars[key] = val;
    }
  });

  // Preserve TMDB keys if already in existing .env.local or .env
  let baseContent = '';
  if (didBackup && fs.existsSync(backupEnvFile)) {
    baseContent = fs.readFileSync(backupEnvFile, 'utf8');
  } else if (fs.existsSync(localEnvFile)) {
    baseContent = fs.readFileSync(localEnvFile, 'utf8');
  } else if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    baseContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  }

  const mergedVars = {};
  baseContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      mergedVars[key] = val;
    }
  });

  // Override with tenant values
  Object.assign(mergedVars, tenantVars);

  // Write synchronized .env.local for Next.js internal loader
  try {
    const serialized = Object.entries(mergedVars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    fs.writeFileSync(localEnvFile, serialized, 'utf8');
  } catch (e) {
    console.warn('Could not write synchronized .env.local:', e.message);
  }
}

process.env.PORT = String(port);

// Lightweight fallback reverse proxy on port 8080 to cleanly intercept third-party embed requests
if (port !== '8080') {
  const http = require('http');
  const proxyServer = http.createServer((req, res) => {
    const options = {
      hostname: '127.0.0.1',
      port: Number(port),
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${port}` },
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': '*',
      });
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on('error', () => {
      res.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      });
      res.end(JSON.stringify({ success: true, message: 'Fallback proxy active' }));
    });
    req.pipe(proxyReq, { end: true });
  });
  proxyServer.on('error', () => {}); // Ignore silently if port 8080 is already used
  proxyServer.listen(8080, '127.0.0.1', () => {
    console.log(`🔌 Local fallback proxy active on http://localhost:8080 -> :${port}`);
  });
}

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || site;
const niche = process.env.NEXT_PUBLIC_PRIMARY_NICHE || 'movies';
const color = process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#FF1E56';

console.log(
  `\n🎬 Starting [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}] ${siteName} on http://localhost:${port} [Niche: ${niche}, Color: ${color}]\n`
);

let child;
const standaloneServer = path.resolve(process.cwd(), '.next', 'standalone', 'server.js');

if (isProd && fs.existsSync(standaloneServer)) {
  // Sync static assets to standalone directory if missing
  const pubSrc = path.resolve(process.cwd(), 'public');
  const pubDst = path.resolve(process.cwd(), '.next', 'standalone', 'public');
  if (fs.existsSync(pubSrc) && !fs.existsSync(pubDst)) {
    try {
      fs.cpSync(pubSrc, pubDst, { recursive: true });
    } catch (e) {}
  }

  const staticSrc = path.resolve(process.cwd(), '.next', 'static');
  const staticDst = path.resolve(process.cwd(), '.next', 'standalone', '.next', 'static');
  if (fs.existsSync(staticSrc) && !fs.existsSync(staticDst)) {
    try {
      fs.cpSync(staticSrc, staticDst, { recursive: true });
    } catch (e) {}
  }

  child = spawn(process.execPath, [standaloneServer], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  });
} else {
  const nextBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'next');
  const cmd = isProd ? 'start' : 'dev';
  child = spawn(nextBin, [cmd, '-p', String(port)], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  });
}

child.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});
