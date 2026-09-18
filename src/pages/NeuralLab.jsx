import React, { useEffect, useMemo, useRef, useState } from "react";
import Experiment, { Range, Stat } from "../components/Experiment.jsx";
import Plot from "../components/Plot.jsx";
import {
  sampleExpression,
  validateExpression,
  sampleX,
} from "../lib/expression.js";
const defaults = {
  expression: "3*x^3 - 2*x + 1",
  layers: [
    { nodes: 8, activation: "relu" },
    { nodes: 8, activation: "relu" },
  ],
  noise: 0,
  seed: 42,
  maxEpochs: 500,
};
const presets = {
  polynomial: defaults,
  oscillating: {
    ...defaults,
    expression: "exp(sin(8*x))",
    layers: [
      { nodes: 8, activation: "sigmoid" },
      { nodes: 8, activation: "sigmoid" },
    ],
  },
  smooth: {
    ...defaults,
    expression: "sin(pi*x)",
    layers: [
      { nodes: 8, activation: "tanh" },
      { nodes: 8, activation: "tanh" },
    ],
  },
  noisy: {
    ...defaults,
    expression: "sin(pi*x)",
    noise: 0.25,
    layers: [
      { nodes: 10, activation: "tanh" },
      { nodes: 10, activation: "tanh" },
    ],
  },
};
function Network({ layers }) {
  const widths = [1, ...layers.map((l) => l.nodes), 1],
    count = widths.length;
  const position = (layer, node) => [
    40 + (layer * 440) / (count - 1),
    25 + ((node + 0.5) * 150) / widths[layer],
  ];
  return (
    <svg
      className="network"
      viewBox="0 0 520 220"
      role="img"
      aria-label={`Network: one input, ${layers.map((l) => `${l.nodes} ${l.activation} neurons`).join(", ")}, one linear output. Lines show connectivity, not weight magnitudes.`}
    >
      {widths.slice(0, -1).flatMap((n, layer) =>
        Array.from({ length: n }, (_, a) =>
          Array.from({ length: widths[layer + 1] }, (_, b) => {
            const [x1, y1] = position(layer, a),
              [x2, y2] = position(layer + 1, b);
            return (
              <line
                key={`${layer}-${a}-${b}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--accent)"
                strokeOpacity=".12"
              />
            );
          }),
        ),
      )}
      {widths.map((n, layer) => (
        <g key={layer}>
          {Array.from({ length: n }, (_, i) => {
            const [cx, cy] = position(layer, i);
            return (
              <circle key={i} cx={cx} cy={cy} r="5" fill="var(--accent)" />
            );
          })}
          <text x={position(layer, 0)[0]} y="207" textAnchor="middle">
            {layer === 0
              ? "x"
              : layer === count - 1
                ? "ŷ"
                : layers[layer - 1].activation}
          </text>
        </g>
      ))}
    </svg>
  );
}
export default function NeuralLab() {
  const [config, setConfig] = useState(defaults),
    [input, setInput] = useState(defaults.expression);
  const [status, setStatus] = useState("ready"),
    [error, setError] = useState(""),
    [data, setData] = useState(null),
    [history, setHistory] = useState([]),
    [samples, setSamples] = useState([]);
  const worker = useRef(null),
    run = useRef(0);
  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );
  const target = useMemo(
    () => sampleExpression(config.expression),
    [config.expression],
  );
  const busy = [
    "loading",
    "training",
    "pausing",
    "paused",
    "resetting",
  ].includes(status);
  const count =
    config.layers.reduce(
      (a, l, i) => a + ((i ? config.layers[i - 1].nodes : 1) + 1) * l.nodes,
      0,
    ) +
    config.layers.at(-1).nodes +
    1;
  function getWorker() {
    if (worker.current) return worker.current;
    const instance = new Worker(
      new URL("../workers/trainWorker.js", import.meta.url),
      { type: "module" },
    );
    worker.current = instance;
    instance.onmessage = ({ data: message }) => {
      if (message.runId !== run.current) return;
      if (message.type === "ready") setStatus("ready");
      if (message.type === "started") {
        setSamples(message.samples);
        setStatus("training");
      }
      if (["progress", "paused", "done"].includes(message.type)) {
        setData(message);
        setHistory((previous) =>
          [
            ...previous.filter((p) => p.epoch !== message.epoch),
            {
              epoch: message.epoch,
              rmse: message.rmse,
              validationRMSE: message.validationRMSE,
            },
          ].slice(-200),
        );
        if (message.type !== "progress")
          setStatus(message.type === "done" ? "complete" : "paused");
      }
      if (message.type === "error") {
        setError(message.message);
        setStatus("error");
      }
    };
    instance.onerror = (event) => {
      event.preventDefault();
      setError("The training worker stopped. Reset and try again.");
      setStatus("error");
      instance.terminate();
      if (worker.current === instance) worker.current = null;
    };
    return instance;
  }
  function reset() {
    run.current++;
    setError("");
    setData(null);
    setHistory([]);
    setSamples([]);
    if (worker.current) {
      setStatus("resetting");
      worker.current.postMessage({ type: "reset", runId: run.current });
    } else setStatus("ready");
  }
  function change(next) {
    reset();
    setConfig(next);
  }
  function applyExpression(event) {
    event?.preventDefault();
    try {
      validateExpression(input);
      change({ ...config, expression: input });
    } catch (e) {
      setError(e.message);
    }
  }
  function start() {
    try {
      if (status === "paused") {
        setStatus("training");
        getWorker().postMessage({ type: "resume", runId: run.current });
        return;
      }
      validateExpression(input);
      const next = { ...config, expression: input };
      setConfig(next);
      setError("");
      setData(null);
      setHistory([]);
      setSamples([]);
      setStatus("loading");
      getWorker().postMessage({
        type: "start",
        runId: ++run.current,
        config: next,
      });
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }
  const prediction = useMemo(
    () =>
      data
        ? sampleX(data.prediction.length).map((x, i) => [x, data.prediction[i]])
        : [],
    [data],
  );
  const fitSeries = useMemo(
    () => [
      { name: "Target", data: target, color: "var(--accent)" },
      {
        name: "Network",
        data: prediction,
        color: "var(--orange)",
        dashed: true,
      },
    ],
    [target, prediction],
  );
  const lossSeries = useMemo(
    () => [
      {
        name: "Training",
        data: history.map((p) => [p.epoch, p.rmse]),
        color: "var(--accent)",
      },
      {
        name: "Held-out",
        data: history.map((p) => [p.epoch, p.validationRMSE]),
        color: "var(--orange)",
        dashed: true,
      },
    ],
    [history],
  );
  return (
    <Experiment
      number="01"
      category="Machine learning"
      title="Neural network approximation"
      intro="Train a fully connected network on a target function. Compare training and held-out error as model capacity, observation noise, and activation functions change."
      method={
        <>
          <p>
            A fully connected network learns from 150 evenly spaced samples on
            [−1, 1], using Adam (learning rate 0.01), mean squared error, and
            batches of 32. Initial weights and observation noise are seeded;
            sample order is fixed. The output neuron is linear. Sigmoid layers
            use four times the Glorot uniform weight limits; other layers use
            standard Glorot initialization. Training stops at the selected epoch
            budget, which does not guarantee convergence.
          </p>
          <p>
            Training RMSE is measured against the observations. Held-out RMSE
            uses 100 interleaved, noiseless samples that never enter training.
            This measures interpolation within this interval, not extrapolation
            or generalization to an unseen task. Noise is uniform within the
            selected amplitude.
          </p>
          <p>
            The network diagram shows connectivity, not learned weight
            magnitudes. Training runs in a separate CPU worker, with chart
            updates limited to about ten per second. Numerical results may
            differ slightly across devices.
          </p>
        </>
      }
    >
      <div className="lab-grid">
        <div className="lab-main">
          <div className="panel plot-panel">
            <div className="panel-heading">
              <h2>Function approximation</h2>
              <span className={`status status-${status}`} role="status">
                {status === "ready"
                  ? "Ready to train"
                  : status === "complete"
                    ? "Training complete"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <Plot
              series={fitSeries}
              points={samples}
              title="Target and learned function"
            />
            <p className="chart-note">
              Dots are training observations. The dashed curve is the network’s
              prediction.
            </p>
            <div className="stats">
              <Stat
                label="Epoch"
                value={`${data?.epoch ?? 0} / ${config.maxEpochs}`}
              />
              <Stat
                label="Training RMSE"
                value={data ? data.rmse.toFixed(4) : "—"}
              />
              <Stat
                label="Held-out RMSE"
                value={data ? data.validationRMSE.toFixed(4) : "—"}
              />
              <Stat
                label="Training time"
                value={data ? `${(data.elapsedMs / 1000).toFixed(2)} s` : "—"}
              />
            </div>
          </div>
          <div className="panel">
            <h2>Learning curve</h2>
            {history.length ? (
              <Plot
                series={lossSeries}
                title="Error as training progresses"
                xLabel="Epoch"
                yLabel="RMSE"
                xDomain={[0, config.maxEpochs]}
                yDomain={[
                  0,
                  Math.max(
                    0.1,
                    ...history.map((p) => Math.max(p.rmse, p.validationRMSE)),
                  ) * 1.08,
                ]}
                height={220}
              />
            ) : (
              <div className="empty-chart">
                <span aria-hidden="true">↗</span>
                <p>Start training to watch the error change.</p>
              </div>
            )}
          </div>
          <details className="panel network-panel">
            <summary>
              Network architecture <span>{count} trainable parameters</span>
            </summary>
            <Network layers={config.layers} />
            <p className="chart-note">
              One scalar input → hidden layers → one scalar output.
            </p>
          </details>
        </div>
        <aside className="panel controls">
          <h2>Model configuration</h2>
          <label className="field">
            Preset
            <select
              disabled={busy}
              value=""
              onChange={(e) => {
                const next = presets[e.target.value];
                if (next) {
                  change(next);
                  setInput(next.expression);
                }
              }}
            >
              <option value="">Choose a starting point</option>
              <option value="polynomial">Polynomial · ReLU</option>
              <option value="oscillating">
                Oscillating function · sigmoid
              </option>
              <option value="smooth">Smooth wave · tanh</option>
              <option value="noisy">Noisy observations · tanh</option>
            </select>
          </label>
          <form onSubmit={applyExpression}>
            <label className="field">
              Target function
              <input
                value={input}
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
                maxLength={160}
                spellCheck="false"
                aria-describedby="function-help"
              />
            </label>
            <p id="function-help" className="help">
              Use x, + − * / ^, sin, cos, tanh, exp, log, sqrt, abs. Domain:
              [−1, 1].
            </p>
            <button
              type="submit"
              className="button secondary small"
              disabled={busy || input === config.expression}
            >
              Apply function
            </button>
          </form>
          <div className="control-divider" />
          <h3>Hidden layers</h3>
          {config.layers.map((layer, i) => (
            <div key={i} className="layer-row">
              <label>
                Layer {i + 1}
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={layer.nodes}
                  disabled={busy}
                  onChange={(e) => {
                    const nodes = Number(e.target.value);
                    if (Number.isInteger(nodes) && nodes >= 1 && nodes <= 10)
                      change({
                        ...config,
                        layers: config.layers.map((l, j) =>
                          j === i ? { ...l, nodes } : l,
                        ),
                      });
                  }}
                />
              </label>
              <label>
                Activation
                <select
                  disabled={busy}
                  value={layer.activation}
                  onChange={(e) =>
                    change({
                      ...config,
                      layers: config.layers.map((l, j) =>
                        j === i ? { ...l, activation: e.target.value } : l,
                      ),
                    })
                  }
                >
                  <option value="relu">ReLU</option>
                  <option value="tanh">tanh</option>
                  <option value="sigmoid">Sigmoid</option>
                </select>
              </label>
              <button
                className="icon-button"
                aria-label={`Remove layer ${i + 1}`}
                disabled={busy || config.layers.length === 1}
                onClick={() =>
                  change({
                    ...config,
                    layers: config.layers.filter((_, j) => j !== i),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="text-button"
            disabled={busy || config.layers.length === 4}
            onClick={() =>
              change({
                ...config,
                layers: [...config.layers, { nodes: 8, activation: "relu" }],
              })
            }
          >
            + Add hidden layer
          </button>
          <div className="control-divider" />
          <label className="field">
            Epoch budget
            <select
              disabled={busy}
              value={config.maxEpochs}
              onChange={(e) =>
                change({ ...config, maxEpochs: Number(e.target.value) })
              }
            >
              {[100, 500, 1000, 2000].map((epochs) => (
                <option key={epochs} value={epochs}>
                  {epochs}
                </option>
              ))}
            </select>
          </label>
          <p className="help">
            Increase the budget if the error is still falling. Train again
            restarts the model with the selected seed.
          </p>
          <Range
            label="Noise amplitude"
            value={config.noise}
            min={0}
            max={0.5}
            step={0.05}
            disabled={busy}
            onChange={(noise) => change({ ...config, noise })}
          />
          <label className="field">
            Random seed
            <input
              type="number"
              min="0"
              max="99999"
              value={config.seed}
              disabled={busy}
              onChange={(e) => {
                const seed = Number(e.target.value);
                if (Number.isInteger(seed) && seed >= 0 && seed <= 99999)
                  change({ ...config, seed });
              }}
            />
          </label>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="training-actions">
            {status === "training" ? (
              <button
                className="button"
                onClick={() => {
                  setStatus("pausing");
                  worker.current.postMessage({
                    type: "pause",
                    runId: run.current,
                  });
                }}
              >
                Pause training
              </button>
            ) : (
              <button
                className="button"
                disabled={["loading", "pausing", "resetting"].includes(status)}
                onClick={start}
              >
                {status === "paused"
                  ? "Resume training"
                  : status === "complete"
                    ? "Train again"
                    : "Start training"}
              </button>
            )}
            <button
              className="button secondary"
              disabled={status === "resetting"}
              onClick={reset}
            >
              Reset
            </button>
          </div>
          <p className="help">
            Runs locally in your browser. No data is uploaded.
          </p>
        </aside>
      </div>
    </Experiment>
  );
}
