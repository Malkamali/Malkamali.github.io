# Personal portfolio website

My personal portfolio website, [malkamali.github.io](https://malkamali.github.io/), presents my research interests, engineering background, and interactive demos in machine learning, physics, and computer vision.

I built the site with React and implemented four interactive demos:

- **Neural-network lab:** TensorFlow.js training in a CPU worker, seeded configurations, noisy samples, held-out evaluation, and pause/reset controls.
- **Chaos lab:** double-pendulum comparison, fixed-step RK4 integration, trajectory separation, phase portrait, and energy diagnostics.
- **Camera geometry:** linked world/image views, camera pose and focal length, perspective/orthographic projection, and transformation matrices.
- **Clustering dynamics:** seeded point clouds, random centroid initialization, animated k-means assignment/update steps, Voronoi regions, and objective history. Cluster count is selected manually.

## Develop

Requires [Bun](https://bun.sh/) 1.4.2 or later. Dependencies are locked in `bun.lock`.

```sh
bun install --frozen-lockfile
bun run dev
```

## Check and preview

```sh
bun run check
bun run preview
```

The production preview defaults to `http://127.0.0.1:4173`. Override with `PORT=4175 bun run preview`. It uses strict static serving: missing routes return 404 instead of silently falling back to the application.

`bun run check` runs numerical, expression-validation, and training-lifecycle tests, then builds the site.

To run the browser checks, start the production preview, then:

```sh
PREVIEW_URL=http://127.0.0.1:4173 bun run test:browser
PREVIEW_URL=http://127.0.0.1:4173 bun scripts/clustering-browser-check.ts
```

Tests launch **Brave**, never Chrome. The default executable is `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`; set `BRAVE_PATH` for another installation. The suite exercises direct links, mobile layouts, controls, reset/pause/resume, invalid input, menu keyboard behavior, and repeated training. Screenshots and measurements are saved in `docs/verification/`.

## NN performance benchmark

The baseline worker is retained in `benchmarks/original-worker.js` for comparison. It is not included in the website build. TensorFlow.js's full package and MathJS are development-only dependencies for that historical implementation. Both original-worker variants use the same code and differ only in selected backend. The improved worker also adds deterministic initialization/order, lifecycle fixes, held-out evaluation, and throttled progress.

Build and serve the isolated harness without hot reload:

```sh
bun run benchmark:build
STATIC_ROOT=.benchmark-build PORT=5176 bun scripts/serve.js
```

In a separate terminal:

```sh
bun run benchmark:nn
```

Run benchmarks without other CPU-intensive work. The harness measures three fresh-worker runs of each variant on the same workload: 500 epochs, 150 samples, 1–8–8–1 network, Adam at 0.01, batch size 32. Results go to `docs/performance/nn-controlled-benchmark.json`. Random initialization in the original means timings and fit quality vary; elapsed-time comparisons are not accuracy equivalence claims.

## Build and publish

```sh
bun run build
# Explicitly publish only after reviewing the production preview:
bun run deploy
```

The build creates `index.html` entry documents for each known route, route metadata, `404.html`, a sitemap, and `.nojekyll`. `/projects/3dcube` remains a compatibility route to `/projects/camera-geometry`. No server-side rendering service is required.

`deploy` validates and publishes `build/` to the existing `gh-pages` branch using your authenticated Git credentials. GitHub Pages should remain configured to serve that branch's root. Publishing must be invoked explicitly.

## Structure and content

- `src/pages/`: homepage and experiment interfaces.
- `src/lib/`: expression parser, training session, physics, camera mathematics, and clustering algorithms.
- `src/workers/`: serialized training command protocol with run identifiers.
- `src/components/`: shared experiment layout, controls, and SVG plots.
- `scripts/`: static route generation, preview, Brave verification, and benchmarking.
- `tests/`: independent equation checks, convergence/energy checks, projection identities, and tensor lifecycle/reproducibility checks.

The research descriptions summarize my background. I built these demos independently; they are separate from my work for my employer. Each demo documents its numerical methods and limitations.
