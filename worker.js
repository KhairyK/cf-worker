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
  <title>KYRT CDN || No File</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }

    body {
      color: #222;
      background: #fff;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 80px;
      background: #f8f8f8;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    header h1 {
      font-size: 1.5rem;
      color: #2b2b2b;
    }

    nav a {
      text-decoration: none;
      color: #333;
      margin: 0 15px;
      font-weight: 500;
      transition: 0.2s;
    }

    nav a:hover {
      color: #0077ff;
    }

    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 100px 80px;
      background: linear-gradient(120deg, #0077ff, #00c6ff);
      color: #fff;
    }

    .hero-text {
      max-width: 50%;
    }

    .hero-text h2 {
      font-size: 2.5rem;
      margin-bottom: 20px;
    }

    .hero-text p {
      font-size: 1.1rem;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .hero-text button {
      background: #fff;
      color: #0077ff;
      border: none;
      padding: 12px 25px;
      font-size: 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.3s;
    }

    .hero-text button:hover {
      background: #e5e5e5;
    }

    .hero img {
      width: 45%;
      border-radius: 10px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

    .features {
      text-align: center;
      padding: 80px 50px;
      background: #f5f5f5;
    }

    .features h3 {
      font-size: 2rem;
      margin-bottom: 40px;
    }

    .feature-list {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 30px;
    }

    .feature {
      background: #fff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      width: 280px;
    }

    .feature h4 {
      margin-bottom: 15px;
      color: #0077ff;
    }

    footer {
      background: #111;
      color: #ccc;
      text-align: center;
      padding: 20px 0;
      font-size: 0.9rem;
    }

    @media (max-width: 800px) {
      .hero {
        flex-direction: column;
        text-align: center;
      }

      .hero-text, .hero img {
        max-width: 100%;
      }

      header {
        padding: 20px;
      }
    }
  </style>
</head>
<body>

  <header>
    <h1>KYRT Framework</h1>
    <nav>
      <a href="#home">Home</a>
      <a href="#fitur">Fitur</a>
      <a href="#kontak">Kontak</a>
    </nav>
  </header>

  <section class="hero" id="home">
    <div class="hero-text">
      <h2>Bangun Ide Hebatmu Dengan Mudah</h2>
      <p>KYRT Framework adalah sebuah framework elegan dibuat dengan PHPin Labs</p>
      <button>Mulai Sekarang</button>
    </div>
    <img src="https://kyrt.my.id/assets/kyrt_logo.jpg" alt="KYRT Image">
  </section>

  <section class="features" id="fitur">
    <h3>Fitur Unggulan</h3>
    <div class="feature-list">
      <div class="feature">
        <h4>Desain Responsif</h4>
        <p>Tampil sempurna di semua perangkat, dari HP hingga desktop.</p>
      </div>
      <div class="feature">
        <h4>Kustom Mudah</h4>
        <p>Ubah warna, teks, dan gambar sesuai keinginan tanpa ribet.</p>
      </div>
      <div class="feature">
        <h4>Ringan dan Cepat</h4>
        <p>Kode bersih dan efisien, meminimalkan waktu loading.</p>
      </div>
    </div>
  </section>

  <footer id="kontak">
    <p>© 2025 (c) By PHPin Labs.</p>
  </footer>

</body>
</html>
`,
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
