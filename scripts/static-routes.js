import { readFile, writeFile, mkdir } from "node:fs/promises";
const base = await readFile("build/index.html", "utf8");
const routes = {
  "/": [
    "Mohamed AlKamali — Research & Engineering",
    "My research interests, engineering background, and interactive demos in machine learning, physics, and computer vision.",
  ],
  "/projects/nnapproximation": [
    "Neural network approximation — Mohamed AlKamali",
    "Train a small neural network and compare training and held-out error in an interactive demo.",
  ],
  "/projects/doublependulum": [
    "Double-pendulum dynamics — Mohamed AlKamali",
    "Compare two double pendulums with a fixed-step simulation, phase portrait, and energy diagnostics.",
  ],
  "/projects/camera-geometry": [
    "Camera geometry — Mohamed AlKamali",
    "Examine camera pose, focal length, and perspective projection through linked world and image views.",
  ],
  "/projects/3dcube": [
    "Camera geometry — Mohamed AlKamali",
    "Examine camera pose, focal length, and perspective projection through linked world and image views.",
  ],
  "/projects/clustering": [
    "Clustering dynamics — Mohamed AlKamali",
    "Follow k-means from random centroids to stable groups with point assignments, Voronoi regions, and centroid paths.",
  ],
};
for (const [route, [title, description]] of Object.entries(routes)) {
  const canonical = `https://malkamali.github.io${route === "/projects/3dcube" ? "/projects/camera-geometry" : route}`;
  const html = base
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*/,
      `$1${description}`,
    )
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*/, `$1${title}`)
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*/,
      `$1${description}`,
    )
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*/, `$1${canonical}`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*/, `$1${canonical}`);
  const directory = `build${route === "/" ? "" : route}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html);
}
await writeFile(
  "build/404.html",
  base
    .replace(
      /<title>.*?<\/title>/,
      "<title>Page not found — Mohamed AlKamali</title>",
    )
    .replace("</head>", '<meta name="robots" content="noindex" /></head>'),
);
await writeFile("build/.nojekyll", "");
await writeFile(
  "build/robots.txt",
  "User-agent: *\nAllow: /\nSitemap: https://malkamali.github.io/sitemap.xml\n",
);
await writeFile(
  "build/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
    routes,
  )
    .filter((r) => r !== "/projects/3dcube")
    .map((r) => `<url><loc>https://malkamali.github.io${r}</loc></url>`)
    .join("")}</urlset>`,
);
console.log("Generated static entry documents for all portfolio routes.");
