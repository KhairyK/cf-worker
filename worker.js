export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

    // Ganti ini ke domain InfinityFree kamu
    const origin = "https://cdn.kyrt.my.id/";

    try {
      const upstream = await fetch(origin + path, {
        headers: { "User-Agent": "KYRT-CDN" },
      });

      if (!upstream.ok) {
        return new Response(
          JSON.stringify({ error: "File not found", path }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const headers = new Headers(upstream.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "*");
      headers.set("Cache-Control", "public, max-age=31536000");

      return new Response(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Fetch failed", detail: err.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
