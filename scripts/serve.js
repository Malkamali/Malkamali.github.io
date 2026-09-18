// A strict static preview: unknown paths return 404, so SPA fallbacks cannot hide routing bugs.
import { resolve, sep } from "node:path";
const root = resolve(process.env.STATIC_ROOT || "build"),
  port = Number(process.env.PORT || 4173);
Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    const path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep))
      return new Response("Forbidden", { status: 403 });
    for (const candidate of [path, `${path}/index.html`]) {
      const file = Bun.file(candidate);
      if ((await file.exists()) && file.size) {
        try {
          return new Response(await file.arrayBuffer(), {
            headers: { "Content-Type": file.type },
          });
        } catch {}
      }
    }
    return new Response(Bun.file(`${root}/404.html`), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  },
});
console.log(`Static portfolio preview: http://127.0.0.1:${port}`);
