require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs/promises');
const path = require('path');
const { ensureDataDir, resolveDataDir, readJson, writeJsonAtomic } = require('./storage');
const { validatePosts, validateProjects, validateTech } = require('./validate');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const API_TOKEN = process.env.API_TOKEN || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

function corsOptionsDelegate(req, callback) {
  const origin = req.header('Origin');

  if (!origin) {
    callback(null, { origin: true });
    return;
  }

  if (!ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN) {
    callback(null, { origin: true });
    return;
  }

  callback(new Error('CORS origin denied'));
}

app.use(cors(corsOptionsDelegate));
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';
    console.log(`${ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

function requireBearerToken(req, res, next) {
  const auth = req.header('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Missing bearer token' });
    return;
  }

  const token = auth.slice('Bearer '.length).trim();
  if (!API_TOKEN || token !== API_TOKEN) {
    res.status(401).json({ ok: false, error: 'Invalid token' });
    return;
  }

  next();
}

function cacheHeader(_req, res, next) {
  res.setHeader('Cache-Control', 'public, max-age=60');
  next();
}

function getValidator(key) {
  if (key === 'posts') return validatePosts;
  if (key === 'projects') return validateProjects;
  if (key === 'tech') return validateTech;
  return null;
}

async function bootstrapDataFiles() {
  await ensureDataDir();
  const dataDir = resolveDataDir();
  const rootDir = path.join(__dirname, '..', '..');
  const keys = ['posts', 'projects', 'tech'];

  for (const key of keys) {
    const target = path.join(dataDir, `${key}.json`);
    try {
      await fs.access(target);
    } catch {
      const source = path.join(rootDir, `${key}.json`);
      try {
        const srcRaw = await fs.readFile(source, 'utf8');
        await fs.writeFile(target, srcRaw, 'utf8');
      } catch {
        await fs.writeFile(target, '[]\n', 'utf8');
      }
    }
  }
}

app.get('/api/:key(posts|projects|tech)', cacheHeader, async (req, res) => {
  try {
    const data = await readJson(req.params.key);
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to read data' });
  }
});

app.put('/api/admin/:key(posts|projects|tech)', adminLimiter, requireBearerToken, async (req, res) => {
  const { key } = req.params;
  const validator = getValidator(key);
  const result = validator(req.body);

  if (!result.ok) {
    res.status(400).json({ ok: false, error: result.message });
    return;
  }

  try {
    await writeJsonAtomic(key, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to write data' });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    return;
  }

  if (String(err.message || '').includes('CORS')) {
    res.status(403).json({ ok: false, error: 'CORS denied' });
    return;
  }

  res.status(500).json({ ok: false, error: 'Internal server error' });
});

bootstrapDataFiles()
  .then(() => {
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`MBJ API listening on http://127.0.0.1:${PORT}`);
      console.log(`DATA_DIR=${resolveDataDir()}`);
    });
  })
  .catch((error) => {
    console.error('Failed to bootstrap data files:', error);
    process.exit(1);
  });
