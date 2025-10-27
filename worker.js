import { untar } from "https://cdn.jsdelivr.net/npm/fflate/esm/index.js";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let filePath = url.pathname;

    // Hapus prefix /npm/
    if (!filePath.startsWith("/npm/")) return new Response("Not Found", { status: 404 });
    filePath = filePath.replace("/npm/", "");

    // Parse paket, versi, dan file
    const atIndex = filePath.indexOf("@");
    const slashIndex = filePath.indexOf("/", atIndex);
    const pkg = filePath.slice(0, atIndex);
    const version = filePath.slice(atIndex + 1, slashIndex);
    const fileInside = filePath.slice(slashIndex + 1);

    const cache = caches.default;
    let response = await cache.match(request);
    if (response) return response;

    try {
      // Ambil metadata paket dari registry npm
      const metaRes = await fetch(`https://registry.npmjs.org/${pkg}`);
      if (!metaRes.ok) throw new Error("Package not found");
      const meta = await metaRes.json();

      const ver = version === "latest" ? meta['dist-tags'].latest : version;
      const tarballUrl = meta.versions[ver].dist.tarball;

      // Fetch tarball
      const tarRes = await fetch(tarballUrl);
      const tarArray = new Uint8Array(await tarRes.arrayBuffer());

      // Ekstrak file yang diminta
      const files = {};
      await untar(tarArray, {
        filter: f => f.name.endsWith(fileInside),
        file: f => { files[f.name] = f; }
      });

      const targetFile = files[Object.keys(files)[0]];
      if (!targetFile) throw new Error("File not found in tarball");

      response = new Response(targetFile.buffer, {
        headers: { "Content-Type": "text/css", "Cache-Control": "public, max-age=86400" }
      });
      await cache.put(request, response.clone());
      return response;
    } catch (err) {
      // fallback ke cdn.kyrt.my.id
      return fetch(`https://cdn.kyrt.my.id/${filePath}`);
    }
  }
};
