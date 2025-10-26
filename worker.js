export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const match = pathname.match(/^\/npm\/([^@\/]+)@([^\/]+)\/(.+)/);
    if (!match) {
      return new Response(
        JSON.stringify({
          error: "Invalid URL format. Use /npm/<package>@<version>/<path>",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [, pkg, version, filePath] = match;

    const metaURL = `https://registry.npmjs.org/${pkg}`;
    const metaRes = await fetch(metaURL);
    if (!metaRes.ok) {
      return new Response(
        JSON.stringify({ error: "Package not found on npm", pkg }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const meta = await metaRes.json();
    const tarball = meta.versions?.[version]?.dist?.tarball;

    if (!tarball) {
      return new Response(
        JSON.stringify({ error: "Version not found", version }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const cdnURL = `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${filePath}`;
    const upstream = await fetch(cdnURL);

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: "File not found", filePath }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const headers = new Headers(upstream.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers,
    });
  },
};
