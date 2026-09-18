import React from "react";
import { Link } from "react-router-dom";
export default function Experiment({
  number,
  category,
  title,
  intro,
  children,
  method,
}) {
  return (
    <div className="container experiment">
      <Link className="back-link" to="/#interactive-demos">
        ← All demos
      </Link>
      <header className="experiment-heading">
        <p className="eyebrow">
          Demo {number} / {category}
        </p>
        <h1>{title}</h1>
        <p className="lede">{intro}</p>
      </header>
      {children}
      <section className="method">
        <div>
          <p className="eyebrow">Technical notes</p>
          <h2>Method & limitations</h2>
          <a href="https://github.com/Malkamali/Malkamali.github.io">
            View source code ↗
          </a>
        </div>
        <div>{method}</div>
      </section>
    </div>
  );
}
export function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
}) {
  const id = React.useId();
  return (
    <div className="field">
      <div className="field-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
export function Stat({ label, value, detail }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
