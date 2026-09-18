import React, { useEffect, useRef, useState } from "react";
import Experiment, { Range, Stat } from "../components/Experiment.jsx";
import Plot from "../components/Plot.jsx";
import {
  defaults,
  energy,
  fixedStep,
  gravity,
  initial,
  positions,
  step,
} from "../lib/pendulum.js";
export default function PendulumLab() {
  const [params, setParams] = useState(defaults),
    [running, setRunning] = useState(false),
    [view, setView] = useState({
      time: 0,
      separation: 0,
      drift: 0,
      phase: [],
      separationSeries: [],
    });
  const canvas = useRef(),
    simulation = useRef(),
    active = useRef(false),
    draw = useRef(() => {});
  function reset(p = params) {
    setRunning(false);
    active.current = false;
    const states = initial(p);
    simulation.current = {
      ...states,
      params: p,
      time: 0,
      steps: 0,
      trails: [[], []],
      phase: [],
      separationSeries: [],
      initialEnergy: [energy(states.a, p), energy(states.b, p)],
    };
    publish();
    draw.current();
  }
  function publish() {
    const s = simulation.current;
    if (!s) return;
    const pa = positions(s.a, s.params)[1],
      pb = positions(s.b, s.params)[1];
    const scale =
      (s.params.m1 + s.params.m2) * gravity * s.params.l1 +
      s.params.m2 * gravity * s.params.l2;
    setView({
      time: s.time,
      separation: Math.hypot(pa[0] - pb[0], pa[1] - pb[1]),
      drift:
        (Math.max(
          Math.abs(energy(s.a, s.params) - s.initialEnergy[0]),
          Math.abs(energy(s.b, s.params) - s.initialEnergy[1]),
        ) /
          scale) *
        100,
      phase: [...s.phase],
      separationSeries: [...s.separationSeries],
    });
  }
  function advance(count) {
    const s = simulation.current;
    for (let i = 0; i < count; i++) {
      s.a = step(s.a, s.params);
      s.b = step(s.b, s.params);
      s.time += fixedStep;
      s.steps++;
      if (s.steps % 8 === 0) {
        const pa = positions(s.a, s.params)[1],
          pb = positions(s.b, s.params)[1];
        s.trails[0].push(pa);
        s.trails[1].push(pb);
        s.trails.forEach((t) => {
          if (t.length > 300) t.shift();
        });
        s.phase.push([s.a[0], s.a[2]]);
        s.separationSeries.push([
          s.time,
          Math.hypot(pa[0] - pb[0], pa[1] - pb[1]),
        ]);
        if (s.phase.length > 600) {
          s.phase.shift();
          s.separationSeries.shift();
        }
      }
    }
  }
  useEffect(() => {
    reset(params);
  }, [params]);
  useEffect(() => {
    let frame,
      last = null,
      accumulated = 0,
      lastPublish = 0;
    const element = canvas.current,
      context = element.getContext("2d");
    function render() {
      const s = simulation.current;
      if (!s || !context) return;
      const width = element.clientWidth,
        height = element.clientHeight,
        dpr = Math.min(devicePixelRatio || 1, 2);
      if (
        element.width !== Math.round(width * dpr) ||
        element.height !== Math.round(height * dpr)
      ) {
        element.width = Math.round(width * dpr);
        element.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const scale =
          Math.min(width * 0.43, height * 0.43) / (s.params.l1 + s.params.l2),
        ox = width / 2,
        oy = height / 2;
      context.strokeStyle = "#dce3da";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 28) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 28) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      [s.a, s.b].forEach((state, index) => {
        context.strokeStyle = index ? "#b64b29" : "#1d5947";
        context.fillStyle = context.strokeStyle;
        context.setLineDash(index ? [5, 4] : []);
        context.globalAlpha = 0.35;
        context.lineWidth = 1.5;
        context.beginPath();
        s.trails[index].forEach(([x, y], i) => {
          if (i) context.lineTo(ox + x * scale, oy + y * scale);
          else context.moveTo(ox + x * scale, oy + y * scale);
        });
        context.stroke();
        context.globalAlpha = 1;
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(ox, oy);
        const ps = positions(state, s.params);
        ps.forEach(([x, y]) => context.lineTo(ox + x * scale, oy + y * scale));
        context.stroke();
        ps.forEach(([x, y]) => {
          context.beginPath();
          context.arc(
            ox + x * scale,
            oy + y * scale,
            index ? 5 : 7,
            0,
            2 * Math.PI,
          );
          index ? context.stroke() : context.fill();
        });
      });
      context.setLineDash([]);
      context.fillStyle = "#23392f";
      context.beginPath();
      context.arc(ox, oy, 4, 0, Math.PI * 2);
      context.fill();
    }
    draw.current = render;
    const observer = new ResizeObserver(render);
    observer.observe(element);
    function tick(now) {
      if (active.current) {
        if (last !== null) accumulated += Math.min((now - last) / 1000, 0.05);
        const count = Math.floor(accumulated / fixedStep);
        if (count) {
          advance(count);
          accumulated -= count * fixedStep;
          render();
        }
        if (now - lastPublish >= 100) {
          publish();
          lastPublish = now;
        }
      } else accumulated = 0;
      last = now;
      frame = requestAnimationFrame(tick);
    }
    const visibility = () => {
      if (document.hidden) {
        active.current = false;
        setRunning(false);
        publish();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      draw.current = () => {};
    };
  }, []);
  function toggle() {
    active.current = !active.current;
    setRunning(active.current);
    if (!active.current) publish();
  }
  return (
    <Experiment
      number="02"
      category="Nonlinear dynamics"
      title="Double-pendulum dynamics"
      intro="Compare two double pendulums with a small difference in initial angle. Examine trajectory separation, phase space, and numerical energy conservation."
      method={
        <>
          <p>
            Two point masses move on massless, rigid rods under gravity (9.81
            m/s²), without damping. A fourth-order Runge–Kutta solver advances
            the coupled equations with a fixed step of 1/240 second. The
            simulation pauses when its tab is hidden; slow frames can make
            simulated time lag wall time.
          </p>
          <p>
            Pendulum B starts with a small offset in the first angle. Separation
            measures the distance between their lower masses. This is an
            illustrative finite-time comparison, not a Lyapunov-exponent
            estimate. The phase portrait shows angle θ₁ and angular velocity ω₁
            for A.
          </p>
          <p>
            Energy drift reports the larger absolute energy change across the
            two systems, normalized by their gravitational energy scale. RK4 is
            not energy-preserving: watch this diagnostic, especially over long
            runs. Charts retain the most recent 20 seconds.
          </p>
        </>
      }
    >
      <div className="lab-grid">
        <div className="lab-main">
          <div className="panel simulation-panel">
            <div className="panel-heading">
              <h2>Trajectory comparison</h2>
              <span className="status" role="status">
                {running ? "Running" : view.time ? "Paused" : "Ready"}
              </span>
            </div>
            <canvas
              ref={canvas}
              className="pendulum-canvas"
              role="img"
              aria-label="Double pendulums: solid green A and dashed orange B. Time, separation, and energy drift appear below."
            />
            <div className="canvas-legend">
              <span>
                <i /> A · original
              </span>
              <span>
                <i className="dashed" /> B · +{params.perturbation}°
              </span>
            </div>
            <div className="stats">
              <Stat
                label="Simulation time"
                value={`${view.time.toFixed(2)} s`}
              />
              <Stat
                label="Tip separation"
                value={`${view.separation.toFixed(3)} m`}
              />
              <Stat
                label="Energy drift"
                value={`${view.drift.toExponential(1)} %`}
              />
            </div>
          </div>
          <div className="diagnostic-grid">
            <div className="panel">
              <Plot
                title="Lower-mass separation"
                series={[
                  {
                    name: "A ↔ B",
                    data: view.separationSeries,
                    color: "var(--orange)",
                  },
                ]}
                xLabel="Time (s)"
                yLabel="Distance (m)"
                height={280}
              />
            </div>
            <div className="panel">
              <Plot
                title="Phase portrait · pendulum A"
                series={[
                  { name: "θ₁, ω₁", data: view.phase, color: "var(--accent)" },
                ]}
                xLabel="Angle (rad)"
                yLabel="Angular velocity (rad/s)"
                height={280}
              />
            </div>
          </div>
        </div>
        <aside className="panel controls">
          <h2>Initial conditions</h2>
          <label className="field">
            Preset
            <select
              disabled={running}
              value=""
              onChange={(e) =>
                setParams(
                  e.target.value === "gentle"
                    ? { ...defaults, angle1: 15, angle2: 20 }
                    : defaults,
                )
              }
            >
              <option value="">Choose a starting point</option>
              <option value="chaotic">High-energy motion</option>
              <option value="gentle">Small-angle motion</option>
            </select>
          </label>
          {[
            ["angle1", "First angle", -170, 170, 1, "°"],
            ["angle2", "Second angle", -170, 170, 1, "°"],
            ["perturbation", "Offset for B", 0.01, 2, 0.01, "°"],
            ["l1", "First rod", 0.3, 1.5, 0.1, " m"],
            ["l2", "Second rod", 0.3, 1.5, 0.1, " m"],
            ["m1", "First mass", 0.3, 2, 0.1, " kg"],
            ["m2", "Second mass", 0.3, 2, 0.1, " kg"],
          ].map(([key, label, min, max, increment, unit]) => (
            <Range
              key={key}
              label={label}
              value={params[key]}
              min={min}
              max={max}
              step={increment}
              unit={unit}
              disabled={running}
              onChange={(value) => setParams({ ...params, [key]: value })}
            />
          ))}
          <div className="training-actions">
            <button className="button" onClick={toggle}>
              {running ? "Pause" : view.time ? "Resume" : "Start simulation"}
            </button>
            <button className="button secondary" onClick={() => reset()}>
              Reset
            </button>
            <button
              className="button secondary"
              disabled={running}
              onClick={() => {
                advance(8);
                publish();
                draw.current();
              }}
            >
              Step 1/30 s
            </button>
          </div>
          <p className="help">
            Pause to adjust conditions. Changing a parameter starts a new
            comparison.
          </p>
        </aside>
      </div>
    </Experiment>
  );
}
