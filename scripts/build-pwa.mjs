/** Run AFTER next build. No PWA plugin or additional dependency is needed. */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const next = path.join(root, '.next');
const publicDir = path.join(root, 'public');
const digest = createHash('sha256');
const assets = new Map();
const urlPath = p => '/' + p.split(path.sep).map(encodeURIComponent).join('/');
async function add(url, filename) {
  const bytes = await fs.readFile(filename);
  if (!bytes.length) throw new Error(`Empty required file: ${filename}`);
  assets.set(url, { url, size: bytes.length });
  digest.update(url).update(bytes);
}
async function walk(dir) {
  const output = [];
  for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(p));
    else if (entry.isFile()) output.push(p);
  }
  return output;
}
try {
  const buildId = (await fs.readFile(path.join(next, 'BUILD_ID'), 'utf8')).trim();
  digest.update(buildId);
  const configFile = path.join(next, 'required-server-files.json');
  try {
    const { config } = JSON.parse(await fs.readFile(configFile, 'utf8'));
    if (config.basePath || config.assetPrefix) throw new Error('This Level 1 PWA expects a root URL and same-origin assets. Remove basePath/assetPrefix or adapt the PWA paths before building.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // A static shell is necessary: never precache a personalized/dynamic HTML response.
  await add('/', path.join(next, 'server', 'app', 'index.html'));
  const staticDir = path.join(next, 'static');
  for (const f of await walk(staticDir)) {
    if (!f.endsWith('.map')) await add('/_next/static' + urlPath(path.relative(staticDir, f)), f);
  }
  for (const name of ['child', 'cap', 'shirt', 'pants', 'socks', 'shoes', 'bag']) {
    const relative = path.join('assets', 'child wearing', `${name}.png`);
    await add(urlPath(relative), path.join(publicDir, relative));
  }
  for (const relative of ['offline.html', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png']) {
    await add('/' + relative, path.join(publicDir, relative));
  }
  // Optional teacher recordings: all files in public/audio are downloaded, even
  // before a child listens. Set their audioSrc paths in content.ts as before.
  const audioDir = path.join(publicDir, 'audio');
  try {
    for (const f of await walk(audioDir)) {
      if (/\.(mp3|m4a|ogg|wav|webm)$/i.test(f)) await add('/audio' + urlPath(path.relative(audioDir, f)), f);
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // create-next-app commonly includes this generated metadata route.
  try { await add('/favicon.ico', path.join(root, 'app', 'favicon.ico')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const manifestSource = await fs.readFile(path.join(root, 'app', 'manifest.ts'));
  digest.update(manifestSource);
  assets.set('/manifest.webmanifest', { url: '/manifest.webmanifest', size: 0 });
  const template = await fs.readFile(path.join(root, 'scripts', 'sw-template.js'), 'utf8');
  digest.update(template);
  const manifest = {
    version: digest.digest('hex').slice(0, 20),
    buildId,
    assets: [...assets.values()],
    audioCount: [...assets.keys()].filter(p => p.startsWith('/audio/')).length,
  };
  const worker = template.replace('"__MADRASA_PRECACHE__"', JSON.stringify(manifest));
  await fs.writeFile(path.join(publicDir, 'sw.js'), worker);
  // next export copies public before this post-build runs. Keep its output current.
  try { await fs.access(path.join(root, 'out', 'index.html')); await fs.writeFile(path.join(root, 'out', 'sw.js'), worker); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  console.log(`PWA ready: ${manifest.assets.length} files, ${(manifest.assets.reduce((n,a)=>n+a.size,0)/1048576).toFixed(1)} MB, version ${manifest.version}.`);
  console.log('The device is offline-ready only after its first complete download. Test with npm run start, not next dev.');
} catch (error) {
  console.error('\nPWA generation failed:', error.message);
  console.error('Run this after a successful standard Next.js production build, with all seven PNG assets present.');
  process.exitCode = 1;
}
