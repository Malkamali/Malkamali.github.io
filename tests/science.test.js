import { describe, expect, test } from "bun:test";
import { compileExpression, sampleExpression } from "../src/lib/expression.js";
import {
  defaults,
  derivative,
  energy,
  initial,
  step,
  fixedStep,
  gravity,
} from "../src/lib/pendulum.js";
import { cameraFrame, project, rotateTarget } from "../src/lib/camera.js";
describe("scalar expressions", () => {
  test("precedence, right-associative powers, functions and scientific notation", () => {
    expect(compileExpression("-x^2")(3)).toBe(-9);
    expect(compileExpression("2^3^2")(0)).toBe(512);
    expect(compileExpression("sin(pi*x)+2e-2")(0.5)).toBeCloseTo(1.02);
    expect(compileExpression("2^-2")(0)).toBe(0.25);
  });
  test("rejects executable syntax, assignments, nonfinite/domain errors and excessive input", () => {
    for (const s of [
      "x=2",
      "window.alert(1)",
      "sin x",
      "2x",
      "constructor(x)",
      "x;2",
      "1/0",
      "sqrt(x)",
      "x".repeat(161),
    ])
      expect(() => sampleExpression(s)).toThrow();
  });
});
describe("double pendulum", () => {
  test("rest at the downward equilibrium is stationary", () =>
    expect(step([0, 0, 0, 0], defaults)).toEqual([0, 0, 0, 0]));
  test("accelerations satisfy independently written equations of motion", () => {
    for (const p of [
      defaults,
      { ...defaults, m1: 0.3, m2: 1.7, l1: 0.4, l2: 1.3 },
    ]) {
      const s = [0.7, -0.9, 1.2, -0.4],
        [q1, q2, w1, w2] = s,
        [, , a1, a2] = derivative(s, p),
        { m1, m2, l1, l2 } = p;
      expect(
        (m1 + m2) * l1 * a1 +
          m2 * l2 * Math.cos(q1 - q2) * a2 +
          m2 * l2 * w2 * w2 * Math.sin(q1 - q2) +
          (m1 + m2) * gravity * Math.sin(q1),
      ).toBeCloseTo(0, 10);
      expect(
        l2 * a2 +
          l1 * Math.cos(q1 - q2) * a1 -
          l1 * w1 * w1 * Math.sin(q1 - q2) +
          gravity * Math.sin(q2),
      ).toBeCloseTo(0, 10);
    }
  });
  test("converges with timestep refinement and bounds energy error over 20 s", () => {
    const start = initial(defaults).a;
    const integrate = (dt, duration) => {
      let s = start;
      for (let i = 0; i < Math.round(duration / dt); i++)
        s = step(s, defaults, dt);
      return s;
    };
    const coarse = integrate(1 / 60, 2),
      fine = integrate(1 / 120, 2),
      reference = integrate(1 / 1920, 2);
    const error = (s) => Math.hypot(...s.map((v, i) => v - reference[i]));
    expect(error(fine)).toBeLessThan(error(coarse) / 10);
    const end = integrate(fixedStep, 20);
    expect(
      Math.abs(energy(end, defaults) - energy(start, defaults)),
    ).toBeLessThan(0.001);
  });
});
describe("camera projection", () => {
  test("projects origin to center and obeys inverse-depth scaling", () => {
    const frame = cameraFrame(0, 0, 6);
    expect(project([0, 0, 0], frame)).toEqual([320, 240, 6]);
    expect(project([1, 0, 0], frame, 36)[0]).toBeCloseTo(320 + 640 / 6);
    expect(project([1, 0, -6], frame, 36)[0] - 320).toBeCloseTo(
      (project([1, 0, 0], frame, 36)[0] - 320) / 2,
    );
    expect(project([0, 0, 7], frame)).toBeNull();
  });
  test("orthographic size ignores distance; positive world Y goes up in the image", () => {
    expect(
      project([1, 1, 0], cameraFrame(0, 0, 4), 35, "orthographic").slice(0, 2),
    ).toEqual(
      project([1, 1, 0], cameraFrame(0, 0, 8), 35, "orthographic").slice(0, 2),
    );
    expect(project([0, 1, 0], cameraFrame(0, 0, 6))[1]).toBeLessThan(240);
    expect(Math.hypot(...rotateTarget(73)[0])).toBeCloseTo(Math.sqrt(3));
  });
});
