export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      let path = url.pathname;

      // hapus "/" depan
      if (path.startsWith("/")) path = path.slice(1);

      // Base CDN upstream
      const upstream = "https://cdn.jsdelivr.net/npm/";

      // Bisa juga tambah versioning query param jika perlu
      const version = url.searchParams.get("v") || "";

      const fetchUrl = version ? `${upstream}${path}@${version}` : `${upstream}${path}`;

      const response = await fetch(fetchUrl, {
        headers: {
          "User-Agent": "KYRT-CDN-Proxy",
          "Accept": "*/*"
        }
      });

      if (!response.ok) {
        return new Response("File not found", { status: 404 });
      }

      // Lempar balik konten dari CDN
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const body = await response.arrayBuffer();

      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "max-age=3600" // cache 1 jam
        }
      });
    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  }
};
