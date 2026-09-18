import React, { useEffect, useMemo, useState } from "react";
import Experiment, { Range, Stat } from "../components/Experiment.jsx";
import Plot from "../components/Plot.jsx";
import {
  createClustering,
  generatePoints,
  stepClustering,
  voronoiCells,
} from "../lib/clustering.js";
import "./ClusteringLab.css";

const colors = [
  "#8be0cd",
  "#f7ae82",
  "#b5b0ff",
  "#f0d679",
  "#80c5f1",
  "#f4a5c7",
  "#b9dc86",
  "#e0c5a4",
];
const defaults = {
  pattern: "blobs",
  count: 400,
  spread: 0.08,
  seed: 42,
  k: 4,
  initSeed: 12,
};
const phases = {
  ready: "Random initialization",
  assign: "Assign points",
  update: "Update centroids",
  converged: "Converged",
  limit: "Iteration limit reached",
};
const x = (v) => 100 + v * 560,
  y = (v) => 580 - v * 560;
const positions = (points) =>
  points.map((p) => `${x(p[0])},${y(p[1])}`).join(" ");

function ClusterView({ points, state, regions, connections }) {
  const cells = useMemo(() => voronoiCells(state.centroids), [state.centroids]);
  return (
    <svg
      className="cluster-view"
      viewBox="0 0 760 625"
      role="img"
      aria-label={`${points.length} points and ${state.centroids.length} numbered centroids. ${phases[state.phase]}. Iteration ${state.iteration}.`}
    >
      <title>K-means assignments and centroid paths</title>
      <rect x="100" y="20" width="560" height="560" fill="#123039" />
      {regions &&
        cells.map((cell, i) => (
          <polygon
            key={i}
            points={positions(cell)}
            fill={colors[i]}
            fillOpacity=".085"
            stroke={colors[i]}
            strokeOpacity=".26"
            strokeWidth="1"
          />
        ))}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v} className="cluster-grid">
          <path d={`M${x(v)} 20V580M100 ${y(v)}H660`} />
          <text x={x(v)} y="601" textAnchor="middle">
            {v}
          </text>
          <text x="86" y={y(v) + 4} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <text className="cluster-axis" x="699" y="601">
        x₁
      </text>
      <text className="cluster-axis" x="66" y="24">
        x₂
      </text>
      {connections &&
        state.labels &&
        points.map((p, i) => (
          <line
            key={i}
            x1={x(p[0])}
            y1={y(p[1])}
            x2={x(state.centroids[state.labels[i]][0])}
            y2={y(state.centroids[state.labels[i]][1])}
            stroke={colors[state.labels[i]]}
            strokeOpacity=".13"
          />
        ))}
      {state.trails.map((trail, i) => (
        <polyline
          key={i}
          points={positions(trail)}
          fill="none"
          stroke={colors[i]}
          strokeWidth="2"
          strokeDasharray="4 5"
          opacity=".85"
        />
      ))}
      {points.map((p, i) => (
        <circle
          key={i}
          className="cluster-point"
          cx={x(p[0])}
          cy={y(p[1])}
          r="3"
          fill={state.labels ? colors[state.labels[i]] : "#abc1c7"}
          opacity=".9"
        />
      ))}
      {state.centroids.map((p, i) => (
        <g
          key={i}
          className="cluster-centroid"
          style={{ transform: `translate(${x(p[0])}px, ${y(p[1])}px)` }}
        >
          <circle r="13" fill="#102a32" stroke={colors[i]} strokeWidth="2.5" />
          <text textAnchor="middle" dy="4" fill={colors[i]}>
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ClusteringLab() {
  const [config, setConfig] = useState(defaults);
  const [points, setPoints] = useState(() => generatePoints(defaults));
  const [state, setState] = useState(() =>
    createClustering(generatePoints(defaults), defaults.k, defaults.initSeed),
  );
  const [running, setRunning] = useState(false),
    [delay, setDelay] = useState(800);
  const [regions, setRegions] = useState(true),
    [connections, setConnections] = useState(false);
  useEffect(() => {
    if (!running || state.complete) return;
    const timer = setTimeout(
      () => setState((previous) => stepClustering(points, previous)),
      delay,
    );
    return () => clearTimeout(timer);
  }, [running, state, points, delay]);
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);
  function reset(next = config, regenerate = false) {
    setRunning(false);
    const nextPoints = regenerate ? generatePoints(next) : points;
    setConfig(next);
    setPoints(nextPoints);
    setState(createClustering(nextPoints, next.k, next.initSeed));
  }
  const counts = useMemo(() => {
    const result = Array(config.k).fill(0);
    state.labels?.forEach((label) => result[label]++);
    return result;
  }, [state.labels, config.k]);
  const active = running && !state.complete;
  const objective = state.history.at(-1)?.objective;
  return (
    <Experiment
      number="04"
      category="Unsupervised learning"
      title="Clustering dynamics"
      intro="Follow k-means from random centroids to stable groups. Compare point assignments, centroid movement, and the effect of initialization."
      method={
        <>
          <p>
            Lloyd’s k-means alternates two steps: assign each point to its
            nearest centroid by Euclidean distance, then move each centroid to
            the mean of its assigned points. Initial centroids are sampled from
            distinct data-point indices using the initialization seed. An empty
            cluster retains its previous centroid. Ties go to the lower-numbered
            centroid.
          </p>
          <p>
            The objective is the sum of squared distances to assigned centroids,
            in the coordinates shown. It cannot increase after either step.
            Convergence means assignments are unchanged after a centroid update;
            runs stop after at most 100 updates. The shaded Voronoi cells
            indicate the nearest centroid, while point colours indicate the most
            recent assignment. These can differ briefly after an update.
          </p>
          <p>
            K-means can settle at a local optimum and partitions space into
            convex regions. The ring dataset illustrates why a low objective
            does not necessarily recover meaningful groups. Cluster count k is
            chosen manually. Four Gaussian groups, stretched groups, concentric
            rings, and uniform points are synthetic datasets; the data seed and
            initialization seed are independent.
          </p>
          <p>
            <a href="https://scikit-learn.org/stable/modules/clustering.html#k-means">
              K-means method reference ↗
            </a>
          </p>
        </>
      }
    >
      <div className="lab-grid clustering-lab">
        <div className="lab-main">
          <div className="panel clustering-board">
            <div className="panel-heading">
              <h2>Assignments & centroid paths</h2>
              <span className="status" role="status">
                {phases[state.phase]}
                {active ? " · Running" : ""}
              </span>
            </div>
            <ClusterView
              points={points}
              state={state}
              regions={regions}
              connections={connections}
            />
            <p className="chart-note">
              Numbered circles are centroids. Dashed lines trace their paths.
              Shaded regions mark the nearest centroid.
            </p>
            <ol className="cluster-counts" aria-label="Points per cluster">
              {counts.map((count, i) => (
                <li key={i}>
                  <span style={{ color: colors[i] }}>{i + 1}</span>
                  <span>{state.labels ? `${count} points` : "Unassigned"}</span>
                </li>
              ))}
            </ol>
            <div className="stats">
              <Stat label="Iteration" value={state.iteration} />
              <Stat
                label="Objective · SSE"
                value={objective === undefined ? "—" : objective.toFixed(3)}
              />
              <Stat
                label="Occupied clusters"
                value={
                  state.labels
                    ? `${counts.filter(Boolean).length} / ${config.k}`
                    : "—"
                }
              />
            </div>
          </div>
          <div className="panel">
            <h2>Objective over assignment and update steps</h2>
            {state.history.length > 1 ? (
              <Plot
                title="Within-cluster sum of squares"
                xLabel="Step"
                yLabel="SSE"
                height={220}
                yDomain={[0, state.history[0].objective * 1.08 || 1]}
                series={[
                  {
                    name: "Objective",
                    color: "var(--accent)",
                    data: state.history.map((p) => [p.step, p.objective]),
                  },
                ]}
              />
            ) : (
              <p className="clustering-empty">
                {objective === undefined
                  ? "Run or step through the algorithm to measure the objective."
                  : `First assignment: SSE ${objective.toFixed(3)}. Advance one more step to compare the change.`}
              </p>
            )}
          </div>
        </div>
        <aside className="panel controls">
          <h2>Clustering configuration</h2>
          <div className="clustering-actions">
            <button
              className="button"
              disabled={state.complete}
              onClick={() => setRunning(!active)}
            >
              {state.complete
                ? phases[state.phase]
                : active
                  ? "Pause"
                  : state.phase === "ready"
                    ? "Run clustering"
                    : "Resume"}
            </button>
            <button
              className="button secondary"
              disabled={active || state.complete}
              onClick={() =>
                setState((previous) => stepClustering(points, previous))
              }
            >
              Step
            </button>
            <button className="text-button" onClick={() => reset()}>
              Reset run
            </button>
          </div>
          <p className="help" aria-live="polite">
            {state.phase === "ready"
              ? "First step: assign points to the random centroids."
              : state.phase === "assign"
                ? "Next step: move each centroid to its group’s mean."
                : state.phase === "update"
                  ? "Next step: reassign points to their nearest centroid."
                  : state.phase === "converged"
                    ? "Assignments are stable. Reinitialize to compare another starting point."
                    : "The iteration limit was reached. Reinitialize to try another starting point."}
          </p>
          <Range
            label="Clusters · k"
            value={config.k}
            min={2}
            max={8}
            onChange={(k) => reset({ ...config, k })}
          />
          <label className="field">
            Initialization seed
            <input
              type="number"
              min="0"
              max="99999"
              value={config.initSeed}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (Number.isInteger(value) && value >= 0 && value <= 99999)
                  reset({ ...config, initSeed: value });
              }}
            />
          </label>
          <button
            className="text-button"
            onClick={() =>
              reset({ ...config, initSeed: (config.initSeed + 1) % 100000 })
            }
          >
            Reinitialize centroids ↻
          </button>
          <div className="control-divider" />
          <label className="field">
            Point distribution
            <select
              value={config.pattern}
              onChange={(e) =>
                reset({ ...config, pattern: e.target.value }, true)
              }
            >
              <option value="blobs">Four Gaussian groups</option>
              <option value="stretched">Stretched groups</option>
              <option value="rings">Concentric rings</option>
              <option value="uniform">Uniform random points</option>
            </select>
          </label>
          <Range
            label="Number of points"
            value={config.count}
            min={100}
            max={800}
            step={100}
            onChange={(count) => reset({ ...config, count }, true)}
          />
          <Range
            label="Spread"
            value={config.spread}
            min={0.03}
            max={0.18}
            step={0.01}
            disabled={config.pattern === "uniform"}
            onChange={(spread) => reset({ ...config, spread }, true)}
          />
          <label className="field">
            Data seed
            <input
              type="number"
              min="0"
              max="99999"
              value={config.seed}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (Number.isInteger(value) && value >= 0 && value <= 99999)
                  reset({ ...config, seed: value }, true);
              }}
            />
          </label>
          <button
            className="text-button"
            onClick={() =>
              reset({ ...config, seed: (config.seed + 1) % 100000 }, true)
            }
          >
            Generate new points ↻
          </button>
          <div className="control-divider" />
          <label className="field">
            Step interval
            <select
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            >
              <option value="1400">Slow · 1.4 s</option>
              <option value="800">Normal · 0.8 s</option>
              <option value="300">Fast · 0.3 s</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={regions}
              onChange={(e) => setRegions(e.target.checked)}
            />
            Show cluster regions
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={connections}
              onChange={(e) => setConnections(e.target.checked)}
            />
            Show assignment links
          </label>
        </aside>
      </div>
    </Experiment>
  );
}
