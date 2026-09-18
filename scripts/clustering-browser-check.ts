import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4175",
  out = "docs/verification/clustering";
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  headless: true,
});
try {
  const page = await browser.newPage(),
    results = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => {
    window.__messages = [];
    const Original = window.Worker;
    window.Worker = class extends Original {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", ({ data }) =>
          window.__messages.push(data),
        );
      }
    };
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function click(text) {
    for (const button of await page.$$("button"))
      if ((await button.evaluate((e) => e.textContent.trim())) === text) {
        await button.click();
        return;
      }
    throw Error("Button missing: " + text);
  }
  async function select(label, value) {
    for (const el of await page.$$("label"))
      if (
        (await el.evaluate((e) => e.firstChild.textContent.trim())) === label
      ) {
        const input = await el.$("select");
        await input.select(value);
        return;
      }
    throw Error("Select missing: " + label);
  }
  const getPoints = () =>
    page.$$eval(".cluster-point", (els) =>
      els.map((e) => [e.getAttribute("cx"), e.getAttribute("cy")]),
    );
  const getCenters = () =>
    page.$$eval(".cluster-centroid", (els) =>
      els.map((e) => e.getAttribute("style")),
    );
  const status = () =>
    page.$eval(".clustering-board [role=status]", (e) => e.textContent);
  await page.setViewport({ width: 1440, height: 1000 });
  assert.equal(
    (
      await page.goto(base + "/projects/clustering", {
        waitUntil: "networkidle0",
      })
    ).status(),
    200,
  );
  await page.reload({ waitUntil: "networkidle0" });
  assert.match(await page.title(), /Clustering dynamics/);
  const original = await getPoints(),
    centers = await getCenters();
  assert.equal(original.length, 400);
  await click("Step");
  assert.equal(await status(), "Assign points");
  const initialSSE = await page.$eval(
    ".clustering-board .stat:nth-child(2) strong",
    (e) => Number(e.textContent),
  );
  await click("Step");
  assert.equal(await status(), "Update centroids");
  assert.notDeepEqual(await getCenters(), centers);
  await select("Step interval", "300");
  await click("Resume");
  await wait(400);
  await click("Pause");
  const paused = await status();
  await wait(450);
  assert.equal(await status(), paused);
  await click("Resume");
  await page.waitForFunction(
    () =>
      document.querySelector(".clustering-board [role=status]")?.textContent ===
      "Converged",
    { timeout: 45000 },
  );
  const finalSSE = await page.$eval(
    ".clustering-board .stat:nth-child(2) strong",
    (e) => Number(e.textContent),
  );
  assert.ok(finalSSE <= initialSSE);
  assert.equal(
    await page.$$eval(".cluster-counts li", (els) =>
      els.reduce(
        (n, e) => n + Number(e.lastChild.textContent.split(" ")[0]),
        0,
      ),
    ),
    400,
  );
  await page.screenshot({
    path: `${out}/converged-desktop.png`,
    fullPage: true,
  });
  results.push({
    check: "steps, pause, resume and convergence",
    initialSSE,
    finalSSE,
  });
  await click("Reinitialize centroids ↻");
  assert.deepEqual(await getPoints(), original);
  assert.notDeepEqual(await getCenters(), centers);
  assert.equal(await status(), "Random initialization");
  await click("Generate new points ↻");
  assert.notDeepEqual(await getPoints(), original);
  results.push({
    check: "independent data and centroid regeneration",
    passed: true,
  });
  for (const pattern of ["stretched", "rings", "uniform"]) {
    await select("Point distribution", pattern);
    await click("Step");
    assert.equal(await status(), "Assign points");
  }
  results.push({ check: "all point distributions", passed: true });
  const sliders = await page.$$('input[type="range"]');
  await sliders[0].focus();
  await page.keyboard.press("End");
  await sliders[1].focus();
  await page.keyboard.press("End");
  assert.equal((await getPoints()).length, 800);
  assert.equal((await getCenters()).length, 8);
  assert.equal(await status(), "Random initialization");
  await page.click('input[type="checkbox"]');
  assert.equal(
    await page.$$eval(".cluster-view polygon", (els) => els.length),
    0,
  );
  const checkboxes = await page.$$('input[type="checkbox"]');
  await checkboxes[1].click();
  await click("Step");
  await click("Step");
  assert.equal(
    await page.$$eval(".cluster-view line", (els) => els.length),
    800,
  );
  results.push({
    check: "800 points, k=8, region and assignment-link toggles",
    passed: true,
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(base + "/projects/clustering", {
      waitUntil: "networkidle0",
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    if (width === 390) {
      await click("Step");
      await click("Step");
      await wait(400);
      await page.screenshot({ path: `${out}/mobile.png`, fullPage: true });
    }
    results.push({ check: "responsive layout", width, passed: true });
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + "/projects/nnapproximation", {
    waitUntil: "networkidle0",
  });
  await select("Preset", "oscillating");
  await click("Start training");
  await page.waitForFunction(
    () => window.__messages.some((m) => m.type === "done"),
    { timeout: 30000 },
  );
  const sigmoid = await page.evaluate(() => {
    const { epoch, validationRMSE, rmse, elapsedMs } =
      window.__messages.findLast((m) => m.type === "done");
    return { epoch, validationRMSE, rmse, elapsedMs };
  });
  assert.equal(sigmoid.epoch, 500);
  assert.ok(sigmoid.validationRMSE < 0.1);
  await page.screenshot({ path: `${out}/sigmoid-fixed.png`, fullPage: true });
  results.push({
    check: "exp(sin(8*x)) · two 8-neuron sigmoid layers · seed 42",
    ...sigmoid,
  });
  await select("Epoch budget", "1000");
  await click("Start training");
  await page.waitForFunction(
    () => window.__messages.some((m) => m.type === "done" && m.epoch === 1000),
    { timeout: 30000 },
  );
  assert.match(
    await page.$eval(".stat strong", (e) => e.textContent),
    /1000 \/ 1000/,
  );
  results.push({ check: "configurable epoch budget", passed: true });
  await page.setViewport({ width: 320, height: 900 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(base + "/projects/clustering", { waitUntil: "networkidle0" });
  assert.equal(
    await page.$eval(
      ".cluster-centroid",
      (e) => getComputedStyle(e).transitionDuration,
    ),
    "0s",
  );
  await page.click(".back-link");
  await wait(1000);
  assert.equal(
    await page.$$eval("#interactive-demos .project", (els) => els.length),
    4,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base, { waitUntil: "networkidle0" });
  await page.screenshot({ path: `${out}/home-four-demos.png`, fullPage: true });
  const scripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => e.name.endsWith(".js"))
      .map((e) => e.name),
  );
  assert.ok(!scripts.some((name) => /ClusteringLab|trainWorker/.test(name)));
  results.push({
    check: "reduced motion, homepage integration and lazy loading",
    passed: true,
  });
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/results.json`,
    JSON.stringify({ browser: "Brave", results, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, results, errors }));
} finally {
  await browser.close();
}
