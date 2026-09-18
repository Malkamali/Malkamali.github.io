import React, { useEffect, useId, useRef, useState } from "react";
export default React.memo(function Plot({
  series,
  title,
  xLabel = "x",
  yLabel = "f(x)",
  xDomain,
  yDomain,
  points = [],
  height = 260,
}) {
  const id = useId();
  const figure = useRef(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(
        Math.max(280, Math.min(600, Math.round(entry.contentRect.width))),
      );
    });
    observer.observe(figure.current);
    return () => observer.disconnect();
  }, []);
  const pad = { l: 58, r: 18, t: 25, b: 43 };
  const all = series
    .flatMap((s) => s.data)
    .concat(points)
    .filter((p) => p.every(Number.isFinite));
  let [xmin, xmax] =
    xDomain ||
    (all.length
      ? [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))]
      : [0, 1]);
  let [ymin, ymax] =
    yDomain ||
    (all.length
      ? [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))]
      : [-1, 1]);
  if (xmin === xmax) xmax = xmin + 1;
  if (ymin === ymax) {
    ymin -= 0.5;
    ymax += 0.5;
  }
  if (!yDomain) {
    const extra = (ymax - ymin) * 0.08;
    ymin -= extra;
    ymax += extra;
  }
  const x = (v) =>
    pad.l + ((v - xmin) / (xmax - xmin)) * (width - pad.l - pad.r);
  const y = (v) =>
    height - pad.b - ((v - ymin) / (ymax - ymin)) * (height - pad.t - pad.b);
  const format = (n) =>
    Math.abs(n) >= 1000 ? n.toExponential(1) : Number(n.toFixed(2)).toString();
  return (
    <figure className="plot" ref={figure}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}>
        <title id={id}>
          {title}.{" "}
          {series.map((s) => `${s.name}: ${s.data.length} samples`).join("; ")}
        </title>
        {[0, 1, 2, 3, 4].map((i) => {
          const vx = xmin + ((xmax - xmin) * i) / 4,
            vy = ymin + ((ymax - ymin) * i) / 4;
          return (
            <g key={i} className="plot-grid">
              <line x1={pad.l} x2={width - pad.r} y1={y(vy)} y2={y(vy)} />
              <text x={pad.l - 10} y={y(vy) + 4} textAnchor="end">
                {format(vy)}
              </text>
              <text x={x(vx)} y={height - pad.b + 20} textAnchor="middle">
                {format(vx)}
              </text>
            </g>
          );
        })}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(p[0])}
            cy={y(p[1])}
            r="2.2"
            fill="var(--muted)"
            opacity="0.45"
          />
        ))}
        {series.map((s) => (
          <path
            key={s.name}
            d={s.data
              .filter((p) => p.every(Number.isFinite))
              .map(
                (p, i) =>
                  `${i ? "L" : "M"}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`,
              )
              .join(" ")}
            stroke={s.color}
            strokeDasharray={s.dashed ? "6 4" : undefined}
            fill="none"
            strokeWidth="2.5"
          />
        ))}
        <text
          className="axis-label"
          x={width / 2}
          y={height - 3}
          textAnchor="middle"
        >
          {xLabel}
        </text>
        <text
          className="axis-label"
          transform={`translate(13,${height / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          {yLabel}
        </text>
      </svg>
      <figcaption>
        <span>{title}</span>
        <span className="legend">
          {series.map((s) => (
            <span key={s.name}>
              <i
                style={{
                  borderColor: s.color,
                  borderTopStyle: s.dashed ? "dashed" : "solid",
                }}
              />
              {s.name}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
});
