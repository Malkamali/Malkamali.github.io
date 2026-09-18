import React, { useId, useMemo, useState } from "react";
import Experiment, { Range, Stat } from "../components/Experiment.jsx";
import {
  cameraCoordinates,
  cameraFrame,
  cubeEdges,
  defaults,
  dot,
  project,
  rotateTarget,
} from "../lib/camera.js";
function Line({ a, b, ...props }) {
  return a && b ? (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} {...props} />
  ) : null;
}
export default function CameraLab() {
  const [settings, setSettings] = useState(defaults);
  const id = useId();
  const frame = useMemo(
    () => cameraFrame(settings.yaw, settings.pitch, settings.distance),
    [settings.yaw, settings.pitch, settings.distance],
  );
  const vertices = useMemo(
    () => rotateTarget(settings.rotation),
    [settings.rotation],
  );
  const image = vertices.map((v) =>
    project(v, frame, settings.focal, settings.mode),
  );
  const observer = cameraFrame(-55, 28, 14);
  const world = (p) => {
    const c = cameraCoordinates(p, observer);
    return [320 + c[0] * 39, 245 - c[1] * 39];
  };
  const sensor = [
    [-1, -0.75],
    [1, -0.75],
    [1, 0.75],
    [-1, 0.75],
  ].map(([x, y]) =>
    frame.origin.map(
      (v, i) =>
        v + frame.forward[i] * 1.4 + frame.right[i] * x + frame.up[i] * y,
    ),
  );
  const inside = image.filter(
    (p) => p && p[0] >= 0 && p[0] <= 640 && p[1] >= 0 && p[1] <= 480,
  ).length;
  const matrix = [frame.right, frame.up.map((v) => -v), frame.forward].map(
    (row) => [...row, -dot(row, frame.origin)],
  );
  const set = (key, value) => setSettings({ ...settings, [key]: value });
  return (
    <Experiment
      number="03"
      category="Computer vision"
      title="Camera geometry"
      intro="Examine the mapping from 3D world coordinates to a 2D image. Adjust camera pose, focal length, and projection type using linked geometric views."
      method={
        <>
          <p>
            The target is a cube with side length 2 world units. The orbiting
            camera always looks at the origin. Perspective uses a pinhole camera
            with a 36 × 27 mm sensor, a 640 × 480 pixel image, square pixels,
            and a centered principal point. Lens distortion and occlusion are
            not modelled; all edges remain visible as a wireframe.
          </p>
          <p>
            In camera coordinates, u = fₓ X/Z + 320 and v = 240 − fᵧ Y/Z, with
            fₓ = fᵧ = focal length × 640/36. Moving the camera changes the
            extrinsic transformation; changing focal length changes the
            intrinsics.
          </p>
          <p>
            Orthographic mode removes division by depth and uses a fixed scale
            of 160 pixels per world unit. Its rays are parallel. The world view
            is a separate orthographic overview; the outlined plane is
            schematic. Coordinates and pixel counts below describe the actual
            image on the right.
          </p>
        </>
      }
    >
      <div className="lab-grid camera-lab">
        <div className="lab-main">
          <div className="camera-views">
            <div className="panel camera-panel">
              <div className="panel-heading">
                <h2>World view</h2>
                <span className="mini-label">3D overview</span>
              </div>
              <svg
                viewBox="0 0 640 480"
                role="img"
                aria-label="World view of a cube, camera position, image plane, and projection rays"
              >
                <defs>
                  <pattern
                    id={id}
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M32 0H0V32" fill="none" stroke="#dde3d9" />
                  </pattern>
                </defs>
                <rect width="640" height="480" fill={`url(#${id})`} />
                {[
                  [3, 0, 0],
                  [0, 3, 0],
                  [0, 0, 3],
                ].map((p, i) => (
                  <g key={i}>
                    <Line
                      a={world([0, 0, 0])}
                      b={world(p)}
                      stroke="#819487"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={world(p)[0] + 6}
                      y={world(p)[1]}
                      className="world-label"
                    >
                      {["X", "Y", "Z"][i]}
                    </text>
                  </g>
                ))}
                {settings.rays &&
                  vertices.map((v, i) => {
                    const end =
                      settings.mode === "perspective"
                        ? frame.origin
                        : v.map((n, j) => n - frame.forward[j] * 4);
                    return (
                      <Line
                        key={i}
                        a={world(v)}
                        b={world(end)}
                        stroke="var(--orange)"
                        strokeWidth="1.2"
                        opacity=".45"
                      />
                    );
                  })}
                <polygon
                  points={sensor
                    .map(world)
                    .map((p) => p.join(","))
                    .join(" ")}
                  stroke="var(--orange)"
                  fill="var(--orange)"
                  fillOpacity=".06"
                />
                {cubeEdges.map(([a, b], i) => (
                  <Line
                    key={i}
                    a={world(vertices[a])}
                    b={world(vertices[b])}
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                  />
                ))}
                <circle
                  cx={world(frame.origin)[0]}
                  cy={world(frame.origin)[1]}
                  r="6"
                  fill="var(--orange)"
                />
                <text
                  x={world(frame.origin)[0] + 10}
                  y={world(frame.origin)[1] - 8}
                  className="world-label"
                >
                  Camera
                </text>
              </svg>
              <p className="chart-note">
                Green: target · Orange: camera and projection rays
              </p>
            </div>
            <div className="panel camera-panel">
              <div className="panel-heading">
                <h2>Camera image</h2>
                <span className="mini-label">640 × 480 px</span>
              </div>
              <svg
                viewBox="0 0 640 480"
                role="img"
                aria-label={`${settings.mode} camera image. ${inside} of 8 cube vertices fall inside the image.`}
              >
                <defs>
                  <clipPath id={`${id}-clip`}>
                    <rect width="640" height="480" />
                  </clipPath>
                </defs>
                <rect width="640" height="480" fill="#edf1e8" />
                <path
                  d="M320 0V480M0 240H640"
                  stroke="#c4cfc1"
                  strokeDasharray="5 5"
                />
                <g clipPath={`url(#${id}-clip)`}>
                  {cubeEdges.map(([a, b], i) => (
                    <Line
                      key={i}
                      a={image[a]}
                      b={image[b]}
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                    />
                  ))}
                  {image.map(
                    (p, i) =>
                      p && (
                        <g key={i}>
                          <circle
                            cx={p[0]}
                            cy={p[1]}
                            r="5"
                            fill="var(--accent)"
                          />
                          <text
                            x={p[0] + 9}
                            y={p[1] - 9}
                            className="world-label"
                          >
                            {i}
                          </text>
                        </g>
                      ),
                  )}
                </g>
                <text x="12" y="22" className="world-label">
                  (0, 0)
                </text>
                <text x="628" y="466" textAnchor="end" className="world-label">
                  (640, 480)
                </text>
              </svg>
              <p className="chart-note">
                {inside < 8
                  ? "Some vertices fall outside the sensor. Widen the view or move back."
                  : "All eight vertices are inside the image."}
              </p>
            </div>
          </div>
          <div className="panel">
            <div className="stats">
              <Stat
                label="Projection"
                value={
                  settings.mode === "perspective"
                    ? "Perspective"
                    : "Orthographic"
                }
              />
              <Stat
                label="Focal length"
                value={
                  settings.mode === "perspective"
                    ? `${settings.focal} mm`
                    : "Not used"
                }
              />
              <Stat label="Vertices in frame" value={`${inside} / 8`} />
            </div>
          </div>
          <details className="panel">
            <summary>Inspect the transformation</summary>
            <p className="help">
              World → camera [R | t]. Rows use image-right, image-down, and
              forward axes.
            </p>
            <div className="matrix" aria-label="World to camera matrix">
              {matrix.map((row, i) => (
                <div key={i}>
                  {row.map((v, j) => (
                    <span key={j}>{v.toFixed(3)}</span>
                  ))}
                </div>
              ))}
            </div>
            <p className="help">
              Vertex 0: world ({vertices[0].map((v) => v.toFixed(2)).join(", ")}
              ) → image{" "}
              {image[0]
                ? `(${image[0][0].toFixed(1)}, ${image[0][1].toFixed(1)}) pixels`
                : "behind camera"}
              .
            </p>
          </details>
        </div>
        <aside className="panel controls">
          <h2>Camera & target</h2>
          <label className="field">
            Preset
            <select
              value=""
              onChange={(e) =>
                setSettings(
                  e.target.value === "front"
                    ? { ...defaults, yaw: 0, pitch: 0 }
                    : e.target.value === "wide"
                      ? { ...defaults, distance: 4, focal: 20 }
                      : { ...defaults, distance: 9, focal: 70 },
                )
              }
            >
              <option value="">Choose a view</option>
              <option value="front">Front view</option>
              <option value="wide">Wide angle, close up</option>
              <option value="tele">Long lens, farther away</option>
            </select>
          </label>
          <label className="field">
            Projection
            <select
              value={settings.mode}
              onChange={(e) => set("mode", e.target.value)}
            >
              <option value="perspective">Perspective</option>
              <option value="orthographic">Orthographic</option>
            </select>
          </label>
          <Range
            label="Camera azimuth"
            value={settings.yaw}
            min={-180}
            max={180}
            unit="°"
            onChange={(v) => set("yaw", v)}
          />
          <Range
            label="Camera elevation"
            value={settings.pitch}
            min={-70}
            max={70}
            unit="°"
            onChange={(v) => set("pitch", v)}
          />
          <Range
            label="Distance"
            value={settings.distance}
            min={3}
            max={10}
            step={0.1}
            unit=" units"
            onChange={(v) => set("distance", v)}
          />
          <Range
            label="Focal length"
            value={settings.focal}
            min={15}
            max={85}
            unit=" mm"
            disabled={settings.mode === "orthographic"}
            onChange={(v) => set("focal", v)}
          />
          <Range
            label="Target rotation"
            value={settings.rotation}
            min={-180}
            max={180}
            unit="°"
            onChange={(v) => set("rotation", v)}
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.rays}
              onChange={(e) => set("rays", e.target.checked)}
            />{" "}
            Show projection rays
          </label>
          <button
            className="button secondary"
            onClick={() => setSettings(defaults)}
          >
            Reset view
          </button>
          <p className="help">
            Try moving closer, then shorten the focal length to fit the cube
            again. Notice how its proportions change.
          </p>
        </aside>
      </div>
    </Experiment>
  );
}
