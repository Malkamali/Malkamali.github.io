// A deliberately small scalar language: no assignments, objects, or arbitrary code.
const functions = {
  sin: Math.sin,
  cos: Math.cos,
  tanh: Math.tanh,
  exp: Math.exp,
  log: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
};
export function compileExpression(source) {
  if (typeof source !== "string" || !source.trim() || source.length > 160)
    throw Error("Use an expression of 1–160 characters.");
  const tokens =
    source.match(/(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?|[a-zA-Z]+|\S/g) || [];
  let i = 0;
  function atom() {
    const token = tokens[i++];
    if (token === "(") {
      const fn = expression(0);
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return fn;
    }
    if (token === "+" || token === "-") {
      const fn = expression(3);
      return (x) => (token === "-" ? -1 : 1) * fn(x);
    }
    if (token === "x") return (x) => x;
    if (token === "pi") return () => Math.PI;
    if (token === "e") return () => Math.E;
    if (Object.hasOwn(functions, token)) {
      if (tokens[i++] !== "(") throw Error(`Use ${token}(x).`);
      const fn = expression(0);
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return (x) => functions[token](fn(x));
    }
    if (token && /^(?:\d|\.)/.test(token) && Number.isFinite(Number(token)))
      return () => Number(token);
    throw Error(
      "Use x, numbers, + − * / ^, parentheses, or sin/cos/tanh/exp/log/sqrt/abs.",
    );
  }
  function expression(min) {
    let left = atom();
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4 };
    while (
      Object.hasOwn(precedence, tokens[i]) &&
      precedence[tokens[i]] >= min
    ) {
      const op = tokens[i++],
        a = left,
        b = expression(precedence[op] + (op === "^" ? 0 : 1));
      left = (x) =>
        op === "+"
          ? a(x) + b(x)
          : op === "-"
            ? a(x) - b(x)
            : op === "*"
              ? a(x) * b(x)
              : op === "/"
                ? a(x) / b(x)
                : a(x) ** b(x);
    }
    return left;
  }
  const fn = expression(0);
  if (i !== tokens.length) throw Error("Use * explicitly, for example 3*x.");
  return (x) => {
    const y = fn(x);
    if (!Number.isFinite(y) || Math.abs(y) > 1e4)
      throw Error(
        "The function must stay finite and within ±10,000 over [−1, 1].",
      );
    return y;
  };
}
export const sampleX = (n, midpoints = false) =>
  Array.from({ length: n }, (_, i) =>
    midpoints ? -1 + (2 * (i + 0.5)) / n : -1 + (2 * i) / (n - 1),
  );
export function sampleExpression(source, n = 201) {
  const fn = compileExpression(source);
  return sampleX(n).map((x) => [x, fn(x)]);
}
export function validateExpression(source) {
  const fn = compileExpression(source);
  // Check every grid consumed by the UI or trainer before allocating a model.
  [
    ...sampleX(501),
    ...sampleX(201),
    ...sampleX(150),
    ...sampleX(100, true),
  ].forEach(fn);
  return fn;
}
export function randomSeed(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
