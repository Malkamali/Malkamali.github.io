export const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const subtract = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a) => {
  const length = Math.hypot(...a);
  return a.map((v) => v / length);
};
const rad = (degrees) => (degrees * Math.PI) / 180;
export function cameraFrame(yaw, pitch, distance) {
  const origin = [
    distance * Math.sin(rad(yaw)) * Math.cos(rad(pitch)),
    distance * Math.sin(rad(pitch)),
    distance * Math.cos(rad(yaw)) * Math.cos(rad(pitch)),
  ];
  const forward = normalize(origin.map((v) => -v)),
    right = normalize(cross(forward, [0, 1, 0])),
    up = cross(right, forward);
  return { origin, forward, right, up };
}
export function cameraCoordinates(point, frame) {
  const relative = subtract(point, frame.origin);
  return [
    dot(relative, frame.right),
    dot(relative, frame.up),
    dot(relative, frame.forward),
  ];
}
export function project(point, frame, focal = 35, mode = "perspective") {
  const [x, y, z] = cameraCoordinates(point, frame);
  if (z <= 0.05) return null;
  const scale = mode === "perspective" ? (focal * 640) / 36 / z : 160;
  return [320 + x * scale, 240 - y * scale, z];
}
export const cubeVertices = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];
export const cubeEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];
export function rotateTarget(angle) {
  const c = Math.cos(rad(angle)),
    s = Math.sin(rad(angle));
  return cubeVertices.map(([x, y, z]) => [c * x + s * z, y, -s * x + c * z]);
}
export const defaults = {
  yaw: 30,
  pitch: 18,
  distance: 6,
  focal: 35,
  rotation: 0,
  mode: "perspective",
  rays: true,
};
