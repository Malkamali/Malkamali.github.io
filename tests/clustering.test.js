import { describe, expect, test } from "bun:test";
import {
  assignPoints,
  createClustering,
  generatePoints,
  inertia,
  initialCentroids,
  stepClustering,
  updateCentroids,
  voronoiCells,
} from "../src/lib/clustering.js";

describe("k-means", () => {
  test("nearest assignments and mean updates agree with a hand-computed example", () => {
    const points = [
      [0, 0],
      [0, 2],
      [8, 0],
      [10, 0],
    ];
    const labels = assignPoints(points, [
      [0, 0],
      [9, 0],
    ]);
    expect(labels).toEqual([0, 0, 1, 1]);
    const centers = updateCentroids(points, labels, [
      [0, 0],
      [9, 0],
    ]);
    expect(centers).toEqual([
      [0, 1],
      [9, 0],
    ]);
    expect(inertia(points, labels, centers)).toBe(4);
    expect(
      assignPoints(
        [[1, 0]],
        [
          [0, 0],
          [2, 0],
        ],
      ),
    ).toEqual([0]);
  });
  test("retains empty centroids and handles coincident points without NaNs", () => {
    expect(
      updateCentroids(
        [[0, 0]],
        [0],
        [
          [1, 1],
          [2, 2],
        ],
      ),
    ).toEqual([
      [0, 0],
      [2, 2],
    ]);
    const points = [
      [0.5, 0.5],
      [0.5, 0.5],
    ];
    let state = createClustering(points, 2, 42);
    for (let i = 0; i < 3; i++) state = stepClustering(points, state);
    expect(state.complete).toBe(true);
    expect(state.history.at(-1).objective).toBe(0);
    expect(voronoiCells(state.centroids)[1]).toEqual([]);
  });
  test("seeded data and initialization are repeatable and independent", () => {
    const points = generatePoints({ seed: 42 });
    expect(generatePoints({ seed: 42 })).toEqual(points);
    expect(generatePoints({ seed: 43 })).not.toEqual(points);
    const centers = initialCentroids(points, 4, 12);
    expect(initialCentroids(points, 4, 12)).toEqual(centers);
    expect(initialCentroids(points, 4, 13)).not.toEqual(centers);
    expect(new Set(centers.map((p) => p.join(","))).size).toBe(4);
  });
  test("every assignment and update reduces the objective, ending at a fixed point", () => {
    for (const pattern of ["blobs", "stretched", "rings", "uniform"]) {
      const points = generatePoints({ pattern, count: 400 });
      let state = createClustering(points, 4, 12),
        previous = Infinity;
      while (!state.complete) {
        state = stepClustering(points, state);
        const objective = state.history.at(-1).objective;
        expect(objective).toBeLessThanOrEqual(previous + 1e-10);
        previous = objective;
      }
      expect(state.phase).toBe("converged");
      expect(assignPoints(points, state.centroids)).toEqual(state.labels);
      expect(updateCentroids(points, state.labels, state.centroids)).toEqual(
        state.centroids,
      );
    }
  });
  test("Voronoi bisectors split a unit square correctly and cover its area", () => {
    const cells = voronoiCells([
      [0.25, 0.5],
      [0.75, 0.5],
    ]);
    expect(cells[0].every(([x]) => x <= 0.5)).toBe(true);
    expect(cells[1].every(([x]) => x >= 0.5)).toBe(true);
    const area = (cell) =>
      Math.abs(
        cell.reduce((sum, [x, y], i) => {
          const next = cell[(i + 1) % cell.length];
          return sum + x * next[1] - y * next[0];
        }, 0),
      ) / 2;
    expect(area(cells[0])).toBeCloseTo(0.5, 10);
    const generated = voronoiCells([
      [0.12, 0.36],
      [0.5, 0.9],
      [0.81, 0.22],
      [0.6, 0.45],
    ]);
    expect(generated.reduce((sum, cell) => sum + area(cell), 0)).toBeCloseTo(
      1,
      10,
    );
  });
});
