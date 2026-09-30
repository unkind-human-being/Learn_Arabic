/** Deterministic service-worker tests. Uses Node's built-in VM + in-memory
 * CacheStorage/network doubles; it is NOT a browser/Next.js integration test.
 * Node 20+ (also required by current Next.js projects). */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = await fs.readFile(path.join(root, 'scripts/sw-template.js'), 'utf8');
const origin = 'https://madrasa.test';
const assets = ['/', '/offline.html', '/manifest.webmanifest', '/assets/child%20wearing/child.png', '/_next/static/chunks/app-v1.js', '/audio/shirt.mp3'];
const network = new Map(assets.map(url => [url, { body: url.startsWith('/audio/') ? '0123456789' : 'FILE:' + url, type: url === '/' || url.endsWith('.html') ? 'text/html' : url.endsWith('.js') ? 'text/javascript' : url.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream' }]));
let disconnected = false, failureURL = null, requests = 0, checks = 0;
const keyOf = req => new URL(typeof req === 'string' ? req : req.url, origin).href;
class MemoryCache {
  data = new Map();
  async match(req) { return this.data.get(keyOf(req))?.clone(); }
  async put(req, response) { if (!response.ok) throw new Error('Uncacheable response'); this.data.set(keyOf(req), response.clone()); }
  async keys() { return [...this.data.keys()].map(url => new Request(url)); }
  async delete(req) { return this.data.delete(keyOf(req)); }
}
const stores = new Map();
const caches = { async open(name) { if (!stores.has(name)) stores.set(name, new MemoryCache()); return stores.get(name); }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); } };
function makeWorker(version, urls = assets) {
  const handlers = new Map(), messages = [], workerState = { activated: false, claimed: false };
  const build = { version, assets: urls.map(url => ({ url })), audioCount: 1 };
  const self = { location: { origin }, clients: { async matchAll() { return [{ postMessage(data) { messages.push(data); } }]; }, async claim() { workerState.claimed = true; } }, async skipWaiting() { workerState.activated = true; }, addEventListener(type, fn) { const list = handlers.get(type) || []; list.push(fn); handlers.set(type, list); } };
  class LocalRequest extends Request { constructor(input, options) { super(typeof input === 'string' ? new URL(input, origin) : input, options); } }
  const context = { self, caches, Request: LocalRequest, Response, Headers, URL, console, setTimeout, clearTimeout, async fetch(req) { requests++; const url = new URL(typeof req === 'string' ? req : req.url, origin); if (disconnected) throw new Error('offline'); if (url.pathname === failureURL) return new Response('missing', { status: 404 }); const item = network.get(url.pathname); if (!item) return new Response('missing', { status: 404 }); return new Response(item.body, { headers: { 'Content-Type': item.type } }); } };
  vm.runInNewContext(template.replace('"__MADRASA_PRECACHE__"', JSON.stringify(build)), context);
  async function event(type, extras = {}) { const promises = []; const e = { ...extras, waitUntil(p) { promises.push(p); } }; for (const fn of handlers.get(type) || []) fn(e); await Promise.all(promises); }
  async function status(type = 'PWA_STATUS') { let value; await event('message', { data: { type }, ports: [{ postMessage(v) { value = v; } }] }); return value; }
  async function fetch(url, { navigate = false, method = 'GET', headers = {} } = {}) { let result; const req = { url: new URL(url, origin).href, method, mode: navigate ? 'navigate' : 'cors', headers: new Headers(headers) }; for (const fn of handlers.get('fetch') || []) fn({ request: req, respondWith(p) { assert.equal(result, undefined, 'only one handler claims each request'); result = p; } }); return result === undefined ? undefined : await result; }
  return { event, status, fetch, messages, workerState };
}
function ok(value, text) { assert.ok(value, text); checks++; }
const first = makeWorker('v1');
await first.event('install');
ok((await first.status()).ready, 'Only a complete precache reports ready');
ok(!first.workerState.activated, 'Installing does not force skipWaiting');
await first.event('activate');
ok(first.workerState.claimed, 'Activation claims clients');
const totalBeforeOffline = requests;
disconnected = true;
ok((await first.fetch('/?from=home-screen', { navigate: true })).status === 200, 'Query-string launch works offline');
for (const url of assets.slice(1)) ok((await first.fetch(url)).status === 200, `Offline asset ${url}`);
ok(requests === totalBeforeOffline, 'Offline gameplay resources require no network requests');
const range = await first.fetch('/audio/shirt.mp3', { headers: { Range: 'bytes=2-5' } });
ok(range.status === 206 && await range.text() === '2345', 'Audio ranges work from cache');
const suffix = await first.fetch('/audio/shirt.mp3', { headers: { Range: 'bytes=-3' } });
ok(await suffix.text() === '789', 'Suffix byte ranges work');
ok((await first.fetch('/audio/shirt.mp3', { headers: { Range: 'bytes=100-200' } })).status === 416, 'Invalid audio range is rejected');
ok(await first.fetch('/api/private') === undefined, 'API is not cached');
ok(await first.fetch('/', { method: 'POST' }) === undefined, 'POST is not cached');
ok(await first.fetch('/', { headers: { RSC: '1' } }) === undefined, 'RSC never gets an HTML fallback');
ok(await first.fetch('/reset-offline.html', { navigate: true }) === undefined, 'Reset page bypasses the worker');
ok(await first.fetch('https://external.example/anything') === undefined, 'Cross-origin requests are not intercepted');
await (await caches.open('madrasa-pwa-v2-v1')).delete(assets[3]);
ok(!(await first.status()).ready, 'A missing image clears offline readiness');
const repairOffline = await first.status('PWA_REPAIR');
ok(repairOffline.type === 'PWA_ERROR', 'Repair cannot claim success while offline');
disconnected = false;
ok((await first.status('PWA_REPAIR')).ready, 'Missing file is repaired after reconnecting');
const allAfterRepair = requests;
await first.status('PWA_REPAIR');
ok(requests === allAfterRepair, 'Complete cache is not needlessly redownloaded');
// Failed initial install: partially saved files must not advertise ready.
failureURL = assets[3];
const failed = makeWorker('failed');
await assert.rejects(() => failed.event('install')); checks++;
ok(!(await failed.status()).ready, 'Failed installation never gains readiness');
failureURL = null;
// Version update does not delete the previous complete build or other apps' caches.
await (await caches.open('unrelated-app')).put('/', new Response('keep me'));
const v2asset = '/_next/static/chunks/app-v2.js';
network.set(v2asset, { body: 'V2', type: 'text/javascript' });
const second = makeWorker('v2', assets.map(x => x === assets[4] ? v2asset : x));
await second.event('install');
ok(!second.workerState.activated, 'Downloaded update waits for permission');
await second.event('message', { data: { type: 'PWA_ACTIVATE' } });
ok(second.workerState.activated, 'Explicit update permission activates waiting build');
await second.event('activate');
ok(stores.has('unrelated-app'), 'Other apps caches are retained');
ok(stores.has('madrasa-pwa-v2-v1'), 'Previous version is retained for old tabs');
ok(!stores.has('madrasa-pwa-v2-failed'), 'Old incomplete download is cleaned');
disconnected = true;
ok(await (await second.fetch(assets[4])).text() === 'FILE:' + assets[4], 'Old immutable chunk is available to an older tab offline');
ok((await second.status()).ready, 'New active version remains ready');
console.log(`PASS: ${checks} PWA worker assertions (simulated CacheStorage/network).`);
