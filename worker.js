// server.js
import express from 'express';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Cache memory (TTL 1 jam)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

const JSDELIVR = 'https://cdn.jsdelivr.net/npm/';
const NPM_REGISTRY = 'https://registry.npmjs.org/';

// Folder cache file (opsional, kalau mau persistent caching)
const FILE_CACHE_DIR = path.join(process.cwd(), 'file_cache');
if (!fs.existsSync(FILE_CACHE_DIR)) fs.mkdirSync(FILE_CACHE_DIR);

app.get('/:packageName/:filePath(*)', async (req, res) => {
  const { packageName, filePath } = req.params;
  const cacheKey = `${packageName}/${filePath}`;
  
  try {
    // 1. Cek cache memory dulu
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Serving from memory cache:', cacheKey);
      res.setHeader('Content-Type', cached.contentType);
      return res.send(cached.data);
    }

    // 2. Cek file cache
    const cachedFilePath = path.join(FILE_CACHE_DIR, encodeURIComponent(cacheKey));
    if (fs.existsSync(cachedFilePath)) {
      console.log('Serving from file cache:', cacheKey);
      const data = fs.readFileSync(cachedFilePath);
      res.setHeader('Content-Type', 'application/javascript'); // asumsi js
      cache.set(cacheKey, { data, contentType: 'application/javascript' });
      return res.send(data);
    }

    // 3. Coba fetch dari jsDelivr
    const jsDelivrURL = `${JSDELIVR}${packageName}/${filePath}`;
    let response = await fetch(jsDelivrURL);

    if (!response.ok) {
      // 4. Fallback ke npm registry
      console.log('jsDelivr gagal, fallback ke npm registry:', cacheKey);
      const npmResp = await fetch(`${NPM_REGISTRY}${packageName}`);
      if (!npmResp.ok) return res.status(404).send('File tidak ditemukan');

      const npmData = await npmResp.json();
      const latestVersion = npmData['dist-tags'].latest;
      const tarballURL = npmData.versions[latestVersion].dist.tarball;
      return res.redirect(tarballURL);
    }

    // 5. Streaming ke buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 6. Simpan ke cache memory
    cache.set(cacheKey, { data: buffer, contentType });

    // 7. Simpan ke file cache
    fs.writeFileSync(cachedFilePath, buffer);

    // 8. Kirim ke user
    res.setHeader('Content-Type', contentType);
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`CDN proxy with cache running on http://localhost:${PORT}`);
});
