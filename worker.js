addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/npm/';
const NPM_REGISTRY = 'https://registry.npmjs.org/';

async function handleRequest(request, event) {
  const url = new URL(request.url);
  const pathParts = url.pathname.slice(1).split('/');
  
  if (pathParts.length === 0) {
    return new Response('Path invalid', { status: 400 });
  }

  // Ambil package@version
  const pkgAndVersion = pathParts.shift();
  let [packageName, version] = pkgAndVersion.split('@');
  if (!version) version = 'latest';

  // Sisanya adalah file path
  const filePath = pathParts.join('/');

  const cacheKey = new Request(request.url, request);
  const cache = caches.default;

  // 1. Cek cache Cloudflare
  let response = await cache.match(cacheKey);
  if (response) return response;

  // 2. Fetch dari jsDelivr
  let jsDelivrURL = `${JSDELIVR_BASE}${packageName}@${version}/${filePath}`;
  response = await fetch(jsDelivrURL);

  if (!response.ok) {
    // 3. Fallback ke npm registry
    const npmResp = await fetch(`${NPM_REGISTRY}${packageName}`);
    if (!npmResp.ok) return new Response('Package tidak ditemukan', { status: 404 });

    const npmData = await npmResp.json();

    // Ambil versi yang valid
    if (version === 'latest') version = npmData['dist-tags'].latest;
    else if (!npmData.versions[version]) return new Response('Versi tidak ditemukan', { status: 404 });

    const tarballURL = npmData.versions[version].dist.tarball;

    // Redirect ke tarball npm
    response = Response.redirect(tarballURL, 302);
  }

  // 4. Simpan di cache Cloudflare
  event.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
