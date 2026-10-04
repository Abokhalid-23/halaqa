// Keeps the page usable with weak or no internet: the page comes from the network when it answers quickly, otherwise from the cache.
const CACHE = "halaqa-v5";
const SHELL = ["./", "./index.html", "./manifest.json", "./logo.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const withTimeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("timeout")), ms); p.then(r => { clearTimeout(t); res(r); }, rej); });
const put = (req, res) => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.hostname.endsWith("script.google.com") || url.hostname.endsWith("googleusercontent.com")) return;
  if (url.origin === location.origin) {
    e.respondWith(withTimeout(fetch(req), 4000).then(r => put(req, r))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
    return;
  }
  // fonts and other files: cache first
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => put(req, res))));
});
