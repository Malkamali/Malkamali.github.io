import * as tf from "@tensorflow/tfjs-core";
import {
  sequential,
  layers as layerAPI,
  initializers,
} from "@tensorflow/tfjs-layers";
import "@tensorflow/tfjs-backend-cpu";
import {
  compileExpression,
  validateExpression,
  sampleX,
  randomSeed,
} from "./expression.js";

export function validateConfig(config) {
  const { layers, expression, noise = 0, seed = 42, maxEpochs = 500 } = config;
  if (
    !Array.isArray(layers) ||
    layers.length < 1 ||
    layers.length > 4 ||
    layers.some(
      (l) =>
        !Number.isInteger(l.nodes) ||
        l.nodes < 1 ||
        l.nodes > 10 ||
        !["relu", "tanh", "sigmoid"].includes(l.activation),
    )
  )
    throw Error("Choose 1–4 layers, each with 1–10 neurons.");
  if (
    !Number.isFinite(noise) ||
    noise < 0 ||
    noise > 0.5 ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 99999 ||
    !Number.isInteger(maxEpochs) ||
    maxEpochs < 1 ||
    maxEpochs > 2000
  )
    throw Error("Invalid training configuration.");
  validateExpression(expression);
  return { layers, expression, noise, seed, maxEpochs };
}

export class TrainingSession {
  static async create(config) {
    config = validateConfig(config);
    await tf.setBackend("cpu");
    await tf.ready();
    return new TrainingSession(config);
  }
  constructor(config) {
    this.config = config;
    this.epoch = 0;
    this.running = false;
    this.paused = false;
    this.disposed = false;
    this.elapsedMs = 0;
    this.model = sequential();
    config.layers.forEach((l, i) =>
      this.model.add(
        layerAPI.dense({
          units: l.nodes,
          activation: l.activation,
          ...(i === 0 ? { inputShape: [1] } : {}),
          // Sigmoid's slope is at most 1/4. A wider initial spread avoids
          // starting this scalar demo with nearly constant hidden features.
          // Variance scale 16 gives 4x Glorot's uniform weight limits.
          kernelInitializer: initializers.varianceScaling({
            scale: l.activation === "sigmoid" ? 16 : 1,
            mode: "fanAvg",
            distribution: "uniform",
            seed: config.seed + i,
          }),
        }),
      ),
    );
    this.model.add(
      layerAPI.dense({
        units: 1,
        kernelInitializer: initializers.glorotUniform({
          seed: config.seed + config.layers.length,
        }),
      }),
    );
    this.optimizer = tf.train.adam(0.01);
    this.model.compile({ optimizer: this.optimizer, loss: "meanSquaredError" });
    const fn = compileExpression(config.expression),
      random = randomSeed(config.seed);
    const xs = sampleX(150),
      ys = xs.map((x) => fn(x) + config.noise * (random() * 2 - 1));
    const validationX = sampleX(100, true),
      vizX = sampleX(201);
    this.samples = xs.map((x, i) => [x, ys[i]]);
    // A seeded permutation avoids training on spatially clustered mini-batches.
    // Keep the permutation fixed so pausing/resuming preserves the exact run.
    const order = xs.map((_, i) => i);
    const shuffleRandom = randomSeed(config.seed ^ 0x9e3779b9);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(shuffleRandom() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    this.xTrain = tf.tensor2d(
      order.map((i) => xs[i]),
      [xs.length, 1],
    );
    this.yTrain = tf.tensor2d(
      order.map((i) => ys[i]),
      [ys.length, 1],
    );
    this.xValidation = tf.tensor2d(validationX, [validationX.length, 1]);
    this.yValidation = tf.tensor2d(validationX.map(fn), [
      validationX.length,
      1,
    ]);
    this.xViz = tf.tensor2d(vizX, [vizX.length, 1]);
  }
  snapshot() {
    const result = tf.tidy(() => {
      const train = this.model.predict(this.xTrain),
        validation = this.model.predict(this.xValidation);
      const rmse = tf
        .sqrt(tf.mean(tf.square(tf.sub(train, this.yTrain))))
        .dataSync()[0];
      const validationRMSE = tf
        .sqrt(tf.mean(tf.square(tf.sub(validation, this.yValidation))))
        .dataSync()[0];
      const prediction = Array.from(this.model.predict(this.xViz).dataSync());
      return { rmse, validationRMSE, prediction };
    });
    if (
      !Number.isFinite(result.rmse) ||
      !Number.isFinite(result.validationRMSE) ||
      result.prediction.some((x) => !Number.isFinite(x))
    )
      throw Error(
        "Training diverged. Try a smaller function range or a different activation.",
      );
    return {
      ...result,
      epoch: this.epoch,
      elapsedMs: this.elapsedMs,
      parameters: this.model.countParams(),
      backend: tf.getBackend(),
      tensors: tf.memory().numTensors,
    };
  }
  pause() {
    this.paused = true;
    this.model.stopTraining = true;
  }
  async train(onProgress = () => {}) {
    if (this.running || this.disposed)
      throw Error("Training session is unavailable.");
    this.running = true;
    this.paused = false;
    this.model.stopTraining = false;
    const start = performance.now(),
      previousElapsed = this.elapsedMs;
    let lastYield = start,
      lastReport = start;
    try {
      await this.model.fit(this.xTrain, this.yTrain, {
        initialEpoch: this.epoch,
        epochs: this.config.maxEpochs,
        batchSize: 32,
        // Fixed order plus seeded initialization makes same-backend comparisons repeatable.
        shuffle: false,
        yieldEvery: "never",
        callbacks: {
          onEpochEnd: async (epoch) => {
            this.epoch = epoch + 1;
            const now = performance.now();
            this.elapsedMs = previousElapsed + now - start;
            if (now - lastReport >= 100 || this.epoch === 1) {
              onProgress(this.snapshot());
              lastReport = now;
            }
            // Yield deliberately so stop/reset messages are serviced without a per-batch frame wait.
            if (now - lastYield >= 12) {
              await new Promise((resolve) => setTimeout(resolve, 0));
              lastYield = performance.now();
            }
          },
        },
      });
      this.elapsedMs = previousElapsed + performance.now() - start;
      const final = this.snapshot();
      onProgress(final);
      return final;
    } finally {
      this.running = false;
    }
  }
  dispose() {
    if (this.running)
      throw Error("Stop and await training before disposing its model.");
    if (this.disposed) return;
    this.disposed = true;
    this.model.dispose();
    this.optimizer.dispose();
    tf.dispose([
      this.xTrain,
      this.yTrain,
      this.xValidation,
      this.yValidation,
      this.xViz,
    ]);
  }
}
