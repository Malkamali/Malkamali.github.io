export const gravity = 9.81;
export const fixedStep = 1 / 240;
// State: [theta1, theta2, angularVelocity1, angularVelocity2], radians and seconds.
export function derivative([q1, q2, w1, w2], { m1, m2, l1, l2 }) {
  const delta = q1 - q2,
    sin = Math.sin(delta),
    cos = Math.cos(delta);
  const a = (m1 + m2) * l1 * l1,
    b = m2 * l1 * l2 * cos,
    c = m2 * l2 * l2;
  const f1 =
    -m2 * l1 * l2 * sin * w2 * w2 - (m1 + m2) * gravity * l1 * Math.sin(q1);
  const f2 = m2 * l1 * l2 * sin * w1 * w1 - m2 * gravity * l2 * Math.sin(q2);
  const det = a * c - b * b;
  return [w1, w2, (c * f1 - b * f2) / det, (a * f2 - b * f1) / det];
}
export function step(state, params, dt = fixedStep) {
  const add = (s, k, amount) => s.map((v, i) => v + k[i] * amount);
  const k1 = derivative(state, params),
    k2 = derivative(add(state, k1, dt / 2), params),
    k3 = derivative(add(state, k2, dt / 2), params),
    k4 = derivative(add(state, k3, dt), params);
  return state.map(
    (v, i) => v + (dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6,
  );
}
export function energy([q1, q2, w1, w2], { m1, m2, l1, l2 }) {
  return (
    0.5 * (m1 + m2) * l1 * l1 * w1 * w1 +
    0.5 * m2 * l2 * l2 * w2 * w2 +
    m2 * l1 * l2 * w1 * w2 * Math.cos(q1 - q2) -
    (m1 + m2) * gravity * l1 * Math.cos(q1) -
    m2 * gravity * l2 * Math.cos(q2)
  );
}
export function positions([q1, q2], { l1, l2 }) {
  const x = l1 * Math.sin(q1),
    y = l1 * Math.cos(q1);
  return [
    [x, y],
    [x + l2 * Math.sin(q2), y + l2 * Math.cos(q2)],
  ];
}
export const radians = (degrees) => (degrees * Math.PI) / 180;
export const defaults = {
  m1: 1,
  m2: 1,
  l1: 1,
  l2: 1,
  angle1: 110,
  angle2: -15,
  perturbation: 0.1,
};
export function initial(params) {
  return {
    a: [radians(params.angle1), radians(params.angle2), 0, 0],
    b: [
      radians(params.angle1 + params.perturbation),
      radians(params.angle2),
      0,
      0,
    ],
  };
}
