/** One-time, idempotent setup. Keeps your Next.js version and existing commands. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const target = path.join(root, 'package.json');
  const original = await fs.readFile(target, 'utf8');
  const pkg = JSON.parse(original);
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) throw new Error('No Next.js dependency found. Copy this package into your existing learn_arabic project first.');
  pkg.scripts ??= {};
  if (!pkg.scripts.build?.includes('scripts/build-pwa.mjs')) {
    // Keep a local backup, but do not overwrite a previous backup.
    try { await fs.writeFile(path.join(root, 'package.json.before-pwa'), original, { flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    pkg.scripts.build = `${pkg.scripts.build || 'next build'} && node scripts/build-pwa.mjs`;
  }
  pkg.scripts.start ??= 'next start';
  pkg.scripts['pwa:verify'] ??= 'node scripts/verify-pwa.mjs';
  await fs.writeFile(target, JSON.stringify(pkg, null, 2) + '\n');
  const ignoreFile = path.join(root, '.gitignore');
  let ignore = await fs.readFile(ignoreFile, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
  for (const line of ['/public/sw.js', '/package.json.before-pwa']) {
    if (!ignore.split(/\r?\n/).includes(line)) ignore += `\n${line}\n`;
  }
  await fs.writeFile(ignoreFile, ignore);
  console.log('PWA build hook installed. No dependencies added.');
  console.log(`build: ${pkg.scripts.build}`);
  console.log('Next: npm run build, then npm run start.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
