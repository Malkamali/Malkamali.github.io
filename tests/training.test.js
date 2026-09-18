import { describe, expect, test } from "bun:test";
import * as tf from "@tensorflow/tfjs-core";
import { TrainingSession, validateConfig } from "../src/lib/training.js";
const config = {
  layers: [
    { nodes: 8, activation: "tanh" },
    { nodes: 8, activation: "tanh" },
  ],
  expression: "sin(pi*x)",
  seed: 42,
  noise: 0,
  maxEpochs: 100,
};
describe("training lifecycle", () => {
  test("sigmoid fits the oscillating regression instead of a nearly constant prediction", async () => {
    await tf.setBackend("cpu");
    const baseline = tf.memory().numTensors;
    for (const seed of [42, 7, 123]) {
      const session = await TrainingSession.create({
        ...config,
        expression: "exp(sin(8*x))",
        layers: [
          { nodes: 8, activation: "sigmoid" },
          { nodes: 8, activation: "sigmoid" },
        ],
        seed,
        maxEpochs: seed === 42 ? 500 : 2000,
      });
      try {
        const initial = session.snapshot().validationRMSE;
        const result = await session.train();
        expect(result.validationRMSE).toBeLessThan(0.1);
        expect(result.validationRMSE).toBeLessThan(initial / 5);
        expect(
          Math.max(...result.prediction) - Math.min(...result.prediction),
        ).toBeGreaterThan(2);
      } finally {
        session.dispose();
      }
      expect(tf.memory().numTensors).toBe(baseline);
    }
  }, 15000);
  test("rejects malformed configuration before allocating tensors", () => {
    expect(() => validateConfig({ ...config, layers: [] })).toThrow();
    expect(() => validateConfig({ ...config, expression: "1/x" })).toThrow();
    expect(() =>
      validateConfig({ ...config, expression: "1/(x-0.32885906)" }),
    ).toThrow();
    expect(() => validateConfig({ ...config, noise: NaN })).toThrow();
  });
  test.each(["tanh", "sigmoid"])(
    "%s learns, pauses/resumes, repeats with a seed and releases tensors",
    async (activation) => {
      const runConfig = {
        ...config,
        layers: config.layers.map((layer) => ({ ...layer, activation })),
      };
      await tf.setBackend("cpu");
      const baseline = tf.memory().numTensors;
      const first = await TrainingSession.create(runConfig);
      const initial = first.snapshot().validationRMSE;
      let paused = false;
      const part = await first.train((data) => {
        if (!paused && data.epoch >= 1) {
          paused = true;
          first.pause();
        }
      });
      expect(part.epoch).toBeLessThan(config.maxEpochs);
      expect(part.epoch).toBeGreaterThan(0);
      const result = await first.train();
      expect(result.epoch).toBe(100);
      expect(result.validationRMSE).toBeLessThan(initial / 2);
      first.dispose();
      expect(tf.memory().numTensors).toBe(baseline);
      const second = await TrainingSession.create(runConfig);
      const repeated = await second.train();
      expect(repeated.validationRMSE).toBeCloseTo(result.validationRMSE, 6);
      second.dispose();
      expect(tf.memory().numTensors).toBe(baseline);
    },
  );
});
