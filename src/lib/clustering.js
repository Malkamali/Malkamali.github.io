import { randomSeed } from "./expression.js";

export const squaredDistance = (a, b) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

export function generatePoints({
  count = 400,
  seed = 42,
  spread = 0.08,
  pattern = "blobs",
} = {}) {
  const random = randomSeed(seed);
  const normal = () =>
    Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12))) *
    Math.cos(2 * Math.PI * random());
  const centers = [
    [0.25, 0.28],
    [0.73, 0.25],
    [0.3, 0.73],
    [0.75, 0.72],
  ];
  return Array.from({ length: count }, (_, i) => {
    if (pattern === "uniform")
      return [0.04 + random() * 0.92, 0.04 + random() * 0.92];
    if (pattern === "rings") {
      const angle = random() * Math.PI * 2;
      const radius = (i % 2 ? 0.34 : 0.15) + normal() * spread * 0.2;
      return [0.5 + Math.cos(angle) * radius, 0.5 + Math.sin(angle) * radius];
    }
    const center = centers[i % centers.length];
    // Rejection sampling keeps the domain bounded without piling points on its edges.
    for (;;) {
      const a = normal() * spread,
        b = normal() * spread;
      const point =
        pattern === "stretched"
          ? [center[0] + a * 1.3 + b * 0.2, center[1] + a * 0.75 - b * 0.35]
          : [center[0] + a, center[1] + b];
      if (point.every((v) => v >= 0.02 && v <= 0.98)) return point;
    }
  });
}

export function initialCentroids(points, k, seed) {
  if (!Number.isInteger(k) || k < 1 || k > points.length)
    throw Error("Choose k between 1 and the number of points.");
  const order = points.map((_, i) => i),
    random = randomSeed(seed);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(random() * (order.length - i));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, k).map((i) => [...points[i]]);
}

export function assignPoints(points, centroids) {
  return points.map((point) => {
    let closest = 0;
    for (let j = 1; j < centroids.length; j++) {
      if (
        squaredDistance(point, centroids[j]) <
        squaredDistance(point, centroids[closest])
      )
        closest = j;
    }
    return closest;
  });
}

export function updateCentroids(points, labels, previous) {
  const sums = previous.map(() => [0, 0, 0]);
  points.forEach((point, i) => {
    const sum = sums[labels[i]];
    sum[0] += point[0];
    sum[1] += point[1];
    sum[2]++;
  });
  return sums.map(([x, y, n], i) => (n ? [x / n, y / n] : [...previous[i]]));
}

export const inertia = (points, labels, centroids) =>
  points.reduce(
    (sum, p, i) => sum + squaredDistance(p, centroids[labels[i]]),
    0,
  );

export function createClustering(points, k, seed) {
  const centroids = initialCentroids(points, k, seed);
  return {
    centroids,
    labels: null,
    phase: "ready",
    iteration: 0,
    history: [],
    trails: centroids.map((p) => [p]),
    complete: false,
  };
}

export function stepClustering(points, state) {
  if (state.complete) return state;
  let centroids = state.centroids,
    labels = state.labels,
    phase,
    complete = false,
    iteration = state.iteration,
    trails = state.trails;
  if (state.phase === "ready" || state.phase === "update") {
    labels = assignPoints(points, centroids);
    complete =
      state.labels !== null &&
      labels.every((label, i) => label === state.labels[i]);
    phase = complete ? "converged" : iteration >= 100 ? "limit" : "assign";
    complete ||= iteration >= 100;
  } else {
    centroids = updateCentroids(points, labels, centroids);
    trails = trails.map((trail, i) => [...trail, centroids[i]]);
    iteration++;
    phase = "update";
  }
  const objective = inertia(points, labels, centroids);
  return {
    centroids,
    labels,
    phase,
    iteration,
    trails,
    complete,
    history: [...state.history, { step: state.history.length + 1, objective }],
  };
}

// Clip the unit square against every perpendicular bisector: exact Voronoi cells.
export function voronoiCells(centroids) {
  return centroids.map((center, i) => {
    let polygon = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    for (let j = 0; j < centroids.length && polygon.length; j++) {
      if (i === j) continue;
      const other = centroids[j],
        dx = other[0] - center[0],
        dy = other[1] - center[1];
      if (dx === 0 && dy === 0) {
        if (j < i) polygon = [];
        continue;
      }
      const limit =
        (other[0] ** 2 + other[1] ** 2 - center[0] ** 2 - center[1] ** 2) / 2;
      const side = (p) => dx * p[0] + dy * p[1] - limit;
      const clipped = [];
      polygon.forEach((a, index) => {
        const b = polygon[(index + 1) % polygon.length],
          da = side(a),
          db = side(b);
        if (da <= 0) clipped.push(a);
        if (da <= 0 !== db <= 0) {
          const t = da / (da - db);
          clipped.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      });
      polygon = clipped;
    }
    return polygon;
  });
}
