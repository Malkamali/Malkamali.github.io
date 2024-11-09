import * as tf from '@tensorflow/tfjs';

let model = null; // Persistent model across calls

const trainModel = async (
  polynomial,
  setApproxData,
  layers,
  trainingRef,
  startEpoch = 0,
  maxEpochs = 500,
  setCurrentEpoch,
  updateWeights,
  setRMSE
) => {
  if (!model) {
    model = tf.sequential();

    layers.forEach((layer, i) => {
      model.add(
        tf.layers.dense({
          units: layer.nodes,
          inputShape: i === 0 ? [1] : undefined,
          activation: layer.activation,
        })
      );
    });

    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  }

  const xTrain = tf.tensor2d(
    Array.from({ length: 500 }, (_, i) => [-1 + (2 * i) / 499]),
    [500, 1]
  );
  const yTrain = xTrain.arraySync().map(([x]) => [polynomial(x)]);

  for (let epoch = startEpoch; epoch < maxEpochs; epoch++) {
    if (!trainingRef.current) {
      console.log(`Training paused at epoch ${epoch}`);
      return epoch;
    }

    const fitResult = await model.fit(xTrain, tf.tensor2d(yTrain), {
      epochs: 1,
      batchSize: 32,
    });

    // Throttle updates to improve performance (e.g., update visuals every 5 epochs)
    if (epoch % 5 === 0 || epoch === maxEpochs - 1) {
      // Update predictions for visualization
      const yPred = model.predict(xTrain);
      setApproxData(Array.from(await yPred.data()));

      // Extract weights for visualization
      const allWeights = model.layers.map((layer, index) => {
        const weights = layer.getWeights();
        if (weights && weights[0]) {
          return weights[0]
            .arraySync()
            .map((row) => row.map((w) => parseFloat(w.toFixed(2))));
        }
        return index === 0 ? [[]] : null;
      });
      updateWeights(allWeights);
    }
    
    // Calculate RMSE
    const rmse = Math.sqrt(fitResult.history.loss[0]);
    setRMSE((prev) => [...prev, { epoch, rmse }]);
    setCurrentEpoch(epoch + 1);
    await new Promise((resolve) => setTimeout(resolve, 200)); // Visual delay
  }

  console.log('Training complete');
  return maxEpochs;
};

export const resetModel = () => {
  model = null; // Reset the model for a fresh start
};

export default trainModel;
