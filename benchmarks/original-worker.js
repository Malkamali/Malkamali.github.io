// Audit baseline from d108619. Only added backend selection/reporting for the controlled comparison.
/* eslint-disable no-restricted-globals, no-undef */
import * as tf from "@tensorflow/tfjs";
import { evaluate } from "mathjs";

let model = null;
let stopRequested = false;

globalThis.addEventListener("message", ({ data }) => {
  const { type, payload } = data;
  if (type === "train") {
    stopRequested = false;
    runTraining(payload);
  } else if (type === "stop") {
    stopRequested = true;
    if (model) model.stopTraining = true;
  } else if (type === "reset") {
    stopRequested = true;
    if (model) model.stopTraining = true;
    model = null;
  }
});

async function runTraining({
  layers,
  expression,
  startEpoch,
  maxEpochs,
  backend,
}) {
  if (backend) await tf.setBackend(backend);
  await tf.ready();
  globalThis.postMessage({ type: "backend", backend: tf.getBackend() });
  if (!model) {
    model = tf.sequential();
    layers.forEach((layer, i) => {
      model.add(
        tf.layers.dense({
          units: layer.nodes,
          inputShape: i === 0 ? [1] : undefined,
          activation: layer.activation,
        }),
      );
    });
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });
  }

  const fn = (x) => {
    try {
      return evaluate(expression, { x });
    } catch {
      return 0;
    }
  };

  const N_TRAIN = 150;
  const N_VIZ = 500;
  const xs = Array.from(
    { length: N_TRAIN },
    (_, i) => -1 + (2 * i) / (N_TRAIN - 1),
  );
  const xViz = Array.from(
    { length: N_VIZ },
    (_, i) => -1 + (2 * i) / (N_VIZ - 1),
  );
  const xTrain = tf.tensor2d(
    xs.map((x) => [x]),
    [N_TRAIN, 1],
  );
  const yTrain = tf.tensor2d(
    xs.map((x) => [fn(x)]),
    [N_TRAIN, 1],
  );
  const xVizTensor = tf.tensor2d(
    xViz.map((x) => [x]),
    [N_VIZ, 1],
  );

  const EPOCHS_PER_BATCH = 20;
  const VIZ_EVERY_N_BATCHES = 3;

  try {
    for (
      let batch = 0, epoch = startEpoch;
      epoch < maxEpochs;
      batch++, epoch += EPOCHS_PER_BATCH
    ) {
      if (stopRequested) {
        globalThis.postMessage({ type: "paused", epoch });
        return;
      }

      const batchEpochs = Math.min(EPOCHS_PER_BATCH, maxEpochs - epoch);
      const result = await model.fit(xTrain, yTrain, {
        epochs: batchEpochs,
        batchSize: 32,
      });

      if (stopRequested) {
        // model.stopTraining caused early exit mid-batch
        globalThis.postMessage({ type: "paused", epoch: epoch + batchEpochs });
        return;
      }

      const endEpoch = epoch + batchEpochs;
      const loss = result.history.loss[result.history.loss.length - 1];
      const rmse = Math.sqrt(loss);

      const updateViz =
        batch % VIZ_EVERY_N_BATCHES === 0 || endEpoch >= maxEpochs;
      let predData = null;
      let weights = null;

      if (updateViz) {
        const pred = model.predict(xVizTensor);
        predData = Array.from(await pred.data());
        pred.dispose();
        weights = model.layers.map((l, idx) => {
          const w = l.getWeights();
          if (w && w[0])
            return w[0]
              .arraySync()
              .map((row) => row.map((v) => parseFloat(v.toFixed(2))));
          return idx === 0 ? [[]] : null;
        });
      }

      globalThis.postMessage({
        type: "progress",
        epoch: endEpoch,
        rmse,
        predData,
        weights,
      });

      // Yield so 'stop' messages can be processed between batches
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    xTrain.dispose();
    yTrain.dispose();
    xVizTensor.dispose();
  }

  globalThis.postMessage({ type: "done", epoch: maxEpochs });
}
