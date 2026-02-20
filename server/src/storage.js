const fs = require('fs/promises');
const path = require('path');

const FILES = {
  posts: 'posts.json',
  projects: 'projects.json',
  tech: 'tech.json'
};

function resolveDataDir() {
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim()) {
    return process.env.DATA_DIR;
  }

  return path.join(__dirname, '..', 'data');
}

async function ensureDataDir() {
  const dataDir = resolveDataDir();
  await fs.mkdir(dataDir, { recursive: true });
  return dataDir;
}

function filePathFor(key) {
  const filename = FILES[key];
  if (!filename) throw new Error(`Unknown data key: ${key}`);
  return path.join(resolveDataDir(), filename);
}

async function readJson(key) {
  await ensureDataDir();
  const file = filePathFor(key);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function writeJsonAtomic(key, payload) {
  await ensureDataDir();
  const file = filePathFor(key);
  const tmp = `${file}.tmp`;
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(tmp, json, 'utf8');
  await fs.rename(tmp, file);
}

module.exports = {
  FILES,
  resolveDataDir,
  ensureDataDir,
  readJson,
  writeJsonAtomic
};
