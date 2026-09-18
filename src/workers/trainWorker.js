import { TrainingSession } from "../lib/training.js";
let session = null,
  runId = null,
  active = null;
let commands = Promise.resolve();
const send = (id, type, payload = {}) =>
  postMessage({ runId: id, type, ...payload });
async function clear() {
  session?.pause();
  await active;
  session?.dispose();
  session = null;
  active = null;
}
function train(id) {
  active = session
    .train((data) => send(id, "progress", data))
    .then((data) =>
      send(
        id,
        session.epoch >= session.config.maxEpochs ? "done" : "paused",
        data,
      ),
    )
    .catch((error) => send(id, "error", { message: error.message }));
}
self.onmessage = ({ data }) => {
  // Commands serialize construction/reset; fitting yields and is deliberately not awaited here.
  commands = commands
    .then(async () => {
      if (data.type === "start") {
        await clear();
        runId = data.runId;
        session = await TrainingSession.create(data.config);
        send(runId, "started", { samples: session.samples });
        train(runId);
      } else if (data.type === "reset") {
        await clear();
        runId = data.runId;
        send(runId, "ready");
      } else if (data.runId === runId && data.type === "pause") {
        session?.pause();
      } else if (data.runId === runId && data.type === "resume") {
        if (
          session &&
          !session.running &&
          session.epoch < session.config.maxEpochs
        )
          train(runId);
      }
    })
    .catch((error) => send(data.runId, "error", { message: error.message }));
};
send(null, "loaded");
