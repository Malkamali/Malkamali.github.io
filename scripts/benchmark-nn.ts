import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
const executablePath =
  process.env.BRAVE_PATH ||
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(
    process.env.BENCHMARK_URL || "http://127.0.0.1:5176/benchmarks/",
  );
  await page.waitForFunction(() => !!window.workers);
  const results = [];
  for (const variant of ["original-webgl", "original-cpu", "improved-cpu"])
    for (let run = 1; run <= 3; run++) {
      const result = await page.evaluate(
        (variant) =>
          new Promise((resolve, reject) => {
            const improved = variant.startsWith("improved"),
              worker = improved
                ? window.workers.improved()
                : window.workers.original();
            const config = {
              layers: [
                { nodes: 8, activation: "relu" },
                { nodes: 8, activation: "relu" },
              ],
              expression: "3*x^3 - 2*x + 1",
              maxEpochs: 500,
              noise: 0,
              seed: 42,
            };
            const start = performance.now();
            let first,
              last,
              backend,
              count = 0;
            const timeout = setTimeout(() => {
              worker.terminate();
              reject(Error("Benchmark timeout"));
            }, 120000);
            worker.onerror = (e) => {
              clearTimeout(timeout);
              worker.terminate();
              reject(Error(e.message));
            };
            worker.onmessage = ({ data }) => {
              if (data.type === "backend") backend = data.backend;
              if (data.type === "error") {
                clearTimeout(timeout);
                worker.terminate();
                reject(Error(data.message));
              }
              if (data.type === "progress") {
                first ??= performance.now();
                last = data;
                count++;
              }
              if (data.type === "done") {
                clearTimeout(timeout);
                const elapsedMs = performance.now() - start;
                worker.terminate();
                resolve({
                  variant,
                  elapsedMs,
                  firstProgressMs: first - start,
                  progressCount: count,
                  backend: backend || last.backend,
                  epoch: data.epoch,
                  rmse: last.rmse,
                  validationRMSE: last.validationRMSE,
                  tensors: last.tensors,
                });
              }
            };
            worker.postMessage(
              improved
                ? { type: "start", runId: 1, config }
                : {
                    type: "train",
                    payload: {
                      ...config,
                      startEpoch: 0,
                      backend: variant.split("-")[1],
                    },
                  },
            );
          }),
        variant,
      );
      results.push({ run, ...result });
      console.log(JSON.stringify({ run, ...result }));
    }
  await mkdir("docs/performance", { recursive: true });
  await writeFile(
    "docs/performance/nn-controlled-benchmark.json",
    JSON.stringify(
      {
        browser: await browser.version(),
        executablePath,
        date: new Date().toISOString(),
        notes:
          "Same Brave process, local production-built static harness; 500 epochs, 150 training samples, 1-8-8-1 network, Adam 0.01, batch size 32. Original WebGL/CPU differ only by explicit backend choice. Improved adds seeded initialization, fixed sample order, held-out evaluation and throttled reporting. Fresh worker per run. Timing includes worker startup.",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
