export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Jika path cuma "/" → tampilkan halaman depan
    if (pathname === "/" || pathname === "") {
      return new Response(
        `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYRT CDN</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kyrt-framework@2.0.11-alpha.2/kyrt.min.css" integrity="sha256-wmsfLl/ZP5x6WBBxBk/NDZbTuicqAm2H+losLwqFraE=" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/kyrt-framework@2.0.11-alpha.2/kyrt-bundle.min.js" integrity="sha256-YIZ1GQnW8sKWAOF42w+bUmjdXOkJXPGKvbh5Sqiv8EQ=" crossorigin="anonymous"></script>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0d0d0d;
      color: #f5f5f5;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    h1 {
      color: #00fff7;
      font-size: 2rem;
      margin-bottom: 10px;
    }
    p {
      color: #999;
      max-width: 600px;
      line-height: 1.6;
    }
    code {
      background: #1a1a1a;
      padding: 3px 6px;
      border-radius: 4px;
      color: #00fff7;
    }
    footer {
      margin-top: 40px;
      font-size: 0.8rem;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>⚡ KYRT CDN</h1>
  <p class="txt-strong-turquoise">
  Selamat Datang Di KYRT CDN!<br>
  cara menggunakan kami.
  </p>
  <pre>https://cdn.musickhairy.workers.dev/npm/:package@:version/:file</pre>
  <footer>© ${new Date().getFullYear()} KYRT Framework CDN</footer>
</body>
</html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // Cek format npm path
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

    // Ambil metadata paket
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

    // Ambil file dari jsDelivr
    const cdnURL = `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${filePath}`;
    const upstream = await fetch(cdnURL);
