/* Source template only. scripts/build-pwa.mjs writes public/sw.js per deployment.
 * This app owns only madrasa-pwa-v2-* caches. It never caches APIs or POSTs.
 */
const BUILD = "__MADRASA_PRECACHE__";
const PREFIX = 'madrasa-pwa-v2-';
const CACHE = PREFIX + BUILD.version;
const READY_KEY = '/__madrasa_offline_ready__';
const URLS = BUILD.assets.map(a => a.url);
const ALLOWED = new Set(URLS);
let preparing = null;

async function broadcast(data) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) client.postMessage({ ...data, version: BUILD.version });
}
function validResponse(response, url) {
  if (!response.ok || response.type === 'opaque' || response.redirected) return false;
  const type = response.headers.get('content-type') || '';
  return url === '/' || url.endsWith('.html') ? type.includes('text/html') : !type.includes('text/html');
}
async function snapshot() {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map(r => new URL(r.url).pathname));
  const count = URLS.filter(url => keys.has(url)).length;
  return { type: 'PWA_STATUS', ready: count === URLS.length && keys.has(READY_KEY), count, total: URLS.length, version: BUILD.version, audioCount: BUILD.audioCount };
}
function prepare() {
  if (preparing) return preparing;
  preparing = (async () => {
    const cache = await caches.open(CACHE);
    // Retain complete downloaded files when an interrupted first download retries.
    let count = 0;
    let cursor = 0;
    await broadcast({ type: 'PWA_PROGRESS', count, total: URLS.length });
    const download = async () => {
      while (cursor < URLS.length) {
        const url = URLS[cursor++];
        if (!(await cache.match(url))) {
          const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
          if (!validResponse(response, url)) throw new Error(`Could not save ${url} (${response.status}).`);
          await cache.put(url, response);
        }
        count++;
        await broadcast({ type: 'PWA_PROGRESS', count, total: URLS.length });
      }
    };
    // Use allSettled so a failed worker cannot mark the batch finished while
    // another download is still running. Failed batches NEVER gain a ready marker.
    const results = await Promise.allSettled(Array.from({ length: Math.min(4, URLS.length) }, download));
    const failure = results.find(r => r.status === 'rejected');
    if (failure) throw failure.reason;
    await cache.put(READY_KEY, new Response(JSON.stringify({ installed: Date.now(), version: BUILD.version }), { headers: { 'Content-Type': 'application/json' } }));
    const status = await snapshot();
    if (!status.ready) throw new Error('Some offline files are missing. Reconnect and try again.');
    await broadcast(status);
    return status;
  })().catch(async error => {
    await broadcast({ type: 'PWA_ERROR', message: error.message || 'Could not complete the offline download.' });
    throw error;
  }).finally(() => { preparing = null; });
  return preparing;
}
self.addEventListener('install', event => {
  // First installation activates normally. Updates wait for explicit approval.
  // Do not skipWaiting here: never interrupt a child's current word.
  event.waitUntil(prepare());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Keep this version + the newest previous complete version for older tabs.
    const previous = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith(PREFIX) || name === CACHE) continue;
      const marker = await (await caches.open(name)).match(READY_KEY);
      const installed = marker ? (await marker.json()).installed || 0 : 0;
      previous.push({ name, installed });
    }
    previous.sort((a,b) => b.installed - a.installed);
    for (const entry of previous.slice(1)) await caches.delete(entry.name);
    await self.clients.claim();
    await broadcast(await snapshot());
  })());
});
self.addEventListener('message', event => {
  const type = event.data?.type;
  if (!['PWA_STATUS', 'PWA_REPAIR', 'PWA_ACTIVATE'].includes(type)) return;
  event.waitUntil((async () => {
    try {
      if (type === 'PWA_ACTIVATE') { if ((await snapshot()).ready) await self.skipWaiting(); return; }
      const result = type === 'PWA_REPAIR' ? await prepare() : await snapshot();
      event.ports[0]?.postMessage(result);
    } catch (error) { event.ports[0]?.postMessage({ type: 'PWA_ERROR', message: error.message }); }
  })());
});
async function ranged(response, header) {
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  let start = 0, end = bytes.byteLength - 1;
  if (match && (match[1] || match[2])) {
    if (match[1]) { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
    else start = Math.max(0, bytes.byteLength - Number(match[2]));
  } else return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
  if (start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding');
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Reset page and SW updates must always reach the network. No RSC/API fallback.
  if (url.pathname === '/reset-offline.html' || url.pathname === '/sw.js' || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      // Cache-first shell keeps HTML and its generated chunks on the SAME build.
      if ((await snapshot()).ready) return (await cache.match('/'));
      try { return await fetch(request); }
      catch { return (await cache.match('/offline.html')) || new Response('Reconnect once to save this game for offline play.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  if (!ALLOWED.has(url.pathname) || url.pathname === '/' || request.headers.has('RSC')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url.pathname);
    if (cached) return request.headers.has('range') ? ranged(cached, request.headers.get('range')) : cached;
    // An old tab can request an old immutable Next.js chunk after an update.
    try {
      const response = await fetch(request);
      if (validResponse(response, url.pathname) && !request.headers.has('range')) await cache.put(url.pathname, response.clone());
      return response;
    } catch { return new Response('This offline file is missing. Reconnect to repair the download.', { status: 503 }); }
  })());
});
// Next.js chunks belonging to older still-open tabs are not in this build's list.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/_next/static/') || ALLOWED.has(url.pathname)) return;
  event.respondWith((async () => {
    for (const name of await caches.keys()) {
      if (!name.startsWith(PREFIX)) continue;
      const response = await (await caches.open(name)).match(url.pathname);
      if (response) return response;
    }
    return fetch(event.request);
  })());
});
