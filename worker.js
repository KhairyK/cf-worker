export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = url.pathname.replace("/npm/", "");
    const cache = caches.default;
    let response = await cache.match(request);
    if (response) return response;

    const npmURL = `https://cdn.jsdelivr.net/npm/${path}`;
    const fallbackURL = `https://cdn.kyrt.my.id/${path}`;

    try {
      response = await fetch(npmURL);
      if (!response.ok) throw new Error("File not found on npm");
    } catch {
      response = await fetch(fallbackURL);
    }

    response = new Response(await response.arrayBuffer(), response);
    response.headers.set("Cache-Control", "public, max-age=86400");
    await cache.put(request, response.clone());
    return response;
  }
};
