import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4175";
const evidence = "docs/verification";
await mkdir(evidence, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.BRAVE_PATH ||
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  headless: true,
});
const results = [],
  errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => {
    window.__messages = [];
    window.__tasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        window.__tasks.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: "longtask", buffered: true });
    const Original = window.Worker;
    window.Worker = class extends Original {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", ({ data }) =>
          window.__messages.push({
            ...data,
            prediction: undefined,
            samples: undefined,
            time: performance.now(),
          }),
        );
      }
      postMessage(...args) {
        window.__commands ??= [];
        window.__commands.push({ data: args[0], time: performance.now() });
        return super.postMessage(...args);
      }
    };
  });
  async function click(text) {
    const handles = await page.$$("button");
    for (const h of handles) {
      if ((await h.evaluate((e) => e.textContent.trim())) === text) {
        await h.click();
        return;
      }
    }
    throw Error(`Button missing: ${text}`);
  }
  async function status(value) {
    await page.waitForFunction(
      (value) => document.querySelector("[role=status]")?.textContent === value,
      { timeout: 30000 },
      value,
    );
  }
  async function capture(name) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
  }
  for (const route of [
    "/",
    "/projects/nnapproximation",
    "/projects/doublependulum",
    "/projects/camera-geometry",
    "/projects/3dcube",
  ]) {
    const response = await page.goto(base + route, {
      waitUntil: "networkidle0",
    });
    assert.equal(response.status(), 200);
    assert.ok(await page.$("h1"));
    await page.reload({ waitUntil: "networkidle0" });
    results.push({ check: "direct route and refresh", route, passed: true });
  }
  assert.equal(
    (
      await page.goto(base + "/does-not-exist", { waitUntil: "networkidle0" })
    ).status(),
    404,
  );
  assert.match(await page.$eval("h1", (e) => e.textContent), /isn’t here/);
  await page.goto(base, { waitUntil: "networkidle0" });
  await capture("home-desktop");
  const homeJS = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => e.name.endsWith(".js"))
      .map((e) => ({ url: e.name, decoded: e.decodedBodySize })),
  );
  assert.equal(homeJS.length, 1);
  results.push({
    check: "homepage loads no experiment code",
    resources: homeJS,
  });
  await page.goto(base + "/projects/nnapproximation", {
    waitUntil: "networkidle0",
  });
  const runs = [];
  for (let i = 0; i < 3; i++) {
    await click(i ? "Train again" : "Start training");
    await status("Training complete");
    runs.push(
      await page.evaluate(() => {
        const start = window.__commands
            .filter((m) => m.data.type === "start")
            .at(-1),
          messages = window.__messages.filter(
            (m) => m.runId === start.data.runId,
          ),
          done = messages.find((m) => m.type === "done"),
          first = messages.find((m) => m.type === "progress");
        return {
          elapsedMs: done.time - start.time,
          firstProgressMs: first.time - start.time,
          epoch: done.epoch,
          rmse: done.rmse,
          validationRMSE: done.validationRMSE,
          tensors: done.tensors,
          longTasks: window.__tasks.filter(
            (t) => t.start >= start.time && t.start <= done.time,
          ),
        };
      }),
    );
  }
  assert.equal(runs[0].epoch, 500);
  assert.equal(runs[0].tensors, runs[2].tensors);
  assert.equal(runs[0].rmse, runs[2].rmse);
  results.push({
    check:
      "production NN 500 epochs × 3, reproducibility and stable tensor count",
    runs,
  });
  await capture("neural-trained-desktop");
  await click("Reset");
  await status("Ready to train");
  assert.equal(
    await page.$$eval(".plot-panel .plot path", (paths) =>
      paths.at(-1).getAttribute("d"),
    ),
    "",
  );
  assert.equal(
    await page.$eval(".stats .stat strong", (e) => e.textContent),
    "0 / 500",
  );
  await click("Start training");
  await status("Training");
  await click("Pause training");
  await status("Paused");
  const paused = await page.$eval(".stats .stat strong", (e) => e.textContent);
  await click("Resume training");
  await status("Training complete");
  await click("Train again");
  await status("Training");
  await click("Reset");
  await status("Ready to train");
  await new Promise((r) => setTimeout(r, 500));
  await status("Ready to train");
  results.push({
    check:
      "reset clears chart, pause/resume, reset during training rejects stale messages",
    paused,
    passed: true,
  });
  await page.$eval('input[maxlength="160"]', (e) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(e, "1/x");
    e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await click("Start training");
  await page.waitForSelector("[role=alert]");
  assert.match(
    await page.$eval("[role=alert]", (e) => e.textContent),
    /finite/,
  );
  await click("Reset");
  await page.goto(base + "/projects/doublependulum", {
    waitUntil: "networkidle0",
  });
  await click("Start simulation");
  await new Promise((r) => setTimeout(r, 2000));
  await click("Pause");
  assert.match(
    await page.$eval(".stats .stat strong", (e) => e.textContent),
    /s/,
  );
  await capture("pendulum-desktop");
  await click("Step 1/30 s");
  await click("Reset");
  assert.equal(
    await page.$eval(".stats .stat strong", (e) => e.textContent),
    "0.00 s",
  );
  await page.goto(base + "/projects/camera-geometry", {
    waitUntil: "networkidle0",
  });
  await capture("camera-desktop");
  await page.select("select:nth-of-type(1)", "front");
  await page.$$eval("select", (selects) => {
    selects[1].value = "orthographic";
    selects[1].dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.equal(
    await page.$$eval("input[type=range]", (inputs) => inputs[3].disabled),
    true,
  );
  await click("Reset view");
  for (const width of [320, 390, 768, 1440])
    for (const route of [
      "/",
      "/projects/nnapproximation",
      "/projects/doublependulum",
      "/projects/camera-geometry",
    ]) {
      await page.setViewport({ width, height: 900, isMobile: width < 500 });
      await page.goto(base + route, { waitUntil: "networkidle0" });
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        canvas: document.querySelector("canvas")?.getBoundingClientRect().width,
        unlabeled: [...document.querySelectorAll("input,select")].filter(
          (e) => !e.labels?.length && !e.getAttribute("aria-label"),
        ).length,
      }));
      assert.ok(
        layout.scroll <= width + 1,
        `${route} overflows ${width}: ${JSON.stringify(layout)}`,
      );
      assert.equal(layout.unlabeled, 0);
      if (width === 390)
        await capture(
          route === "/" ? "home-mobile" : route.split("/").at(-1) + "-mobile",
        );
      results.push({
        check: "responsive and labeled controls",
        route,
        viewport: width,
        ...layout,
      });
    }
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(base, { waitUntil: "networkidle0" });
  await click("Menu +");
  assert.equal(
    await page.$eval(".menu-button", (e) => e.getAttribute("aria-expanded")),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.$eval(".menu-button", (e) => e.getAttribute("aria-expanded")),
    "false",
  );
  assert.equal(
    await page.$eval(".menu-button", (e) => e === document.activeElement),
    true,
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  assert.equal(
    await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter(
          (e) => getComputedStyle(e).animationName !== "none",
        ).length,
    ),
    0,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${evidence}/brave-results.json`,
    JSON.stringify(
      {
        date: new Date().toISOString(),
        browser: await browser.version(),
        base,
        results,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      { passed: true, checks: results.length, runs, errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
