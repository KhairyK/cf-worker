export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

    // Versi opsional via query ?v=1.2.3 atau default ke latest
    const version = url.searchParams.get("v") || "latest";

    // Base CDN utama
    const jsDelivrBase = "https://cdn.jsdelivr.net/npm/";
    // NPM registry fallback
    const npmRegistryBase = "https://registry.npmjs.org/";

    // Fungsi fetch dari CDN utama
    async function fetchCDN(url) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "KYRT-CDN-Proxy" } });
        if (!res.ok) throw new Error("Not Found");
        const contentType = res.headers.get("content-type") || "application/octet-stream";
        const body = await res.arrayBuffer();
        return new Response(body, {
          status: 200,
          headers: { "Content-Type": contentType, "Cache-Control": "max-age=3600" }
        });
      } catch (err) {
        return null; // fallback nanti
      }
    }

    // Coba ambil dari jsDelivr dulu
    let response = await fetchCDN(`${jsDelivrBase}${path}@${version}`);
    if (response) return response;

    // Kalau gagal, fallback ke npm registry +_&
    try {
      const npmUrl = `${npmRegistryBase}${path}`;
      const npmRes = await fetch(npmUrl, { headers: { "User-Agent": "KYRT-CDN-Proxy" } });
      if (!npmRes.ok) return new Response("File not found", { status: 404 });

      const json = await npmRes.json();

      // Ambil tarball versi requested
      const tarballUrl = json.versions[version]?.dist?.tarball || json.versions["latest"].dist.tarball;

      if (!tarballUrl) return new Response("File not found", { status: 404 });

      // Fetch tarball
      const tarRes = await fetch(tarballUrl);
      const tarBody = await tarRes.arrayBuffer();

      return new Response(tarBody, {
        status: 200,
        headers: { "Content-Type": "application/octet-stream", "Cache-Control": "max-age=3600" }
      });
    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  }
};
