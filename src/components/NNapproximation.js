import React, { useState, useCallback, useRef, useEffect } from 'react';
import { startTransition } from 'react';
import { evaluate } from 'mathjs';
import PolynomialPlot from '../utils/PolynomialPlot';
import NeuralNetworkVisualizer from '../utils/NeuralNetworkVisualizer';

const NNapproximation = () => {
  const [layers, setLayers] = useState([
    { nodes: 8, activation: 'relu' },
    { nodes: 8, activation: 'relu' },
  ]);
  const [weights, setWeights] = useState([]);
  const [rmseData, setRMSE] = useState(null);
  const [approxData, setApproxData] = useState([]);
  const [polynomialInput, setPolynomialInput] = useState('3*x^3 - 2*x + 1');
  // polynomialExpr is the validated expression sent to the worker (functions can't cross worker boundary)
  const [polynomialExpr, setPolynomialExpr] = useState('3*x^3 - 2*x + 1');
  const [polynomial, setPolynomial] = useState(() => (x) => 3 * x ** 3 - 2 * x + 1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const workerRef = useRef(null);
  const epochRef = useRef(0);

  const maxLayers = 4;
  const maxNodes = 10;

  const safePolynomial = useCallback((x) => polynomial(x), [polynomial]);

  // Create the worker once on mount; tear it down on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/trainWorker.js', import.meta.url)
    );

    worker.onmessage = ({ data }) => {
      const { type, epoch, rmse, predData, weights: wts } = data;

      if (type === 'progress') {
        epochRef.current = epoch;
        setRMSE({ epoch: epoch - 1, rmse });
        if (predData) {
          startTransition(() => {
            setApproxData(predData);
            if (wts) setWeights(wts);
          });
        }
      } else if (type === 'paused') {
        epochRef.current = data.epoch;
        setIsRunning(false);
        setIsPaused(true);
      } else if (type === 'done') {
        epochRef.current = data.epoch;
        setIsRunning(false);
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      try {
        evaluate(polynomialInput, { x: 0 }); // validate before accepting
        setPolynomial(() => (x) => evaluate(polynomialInput, { x }));
        setPolynomialExpr(polynomialInput);
      } catch {
        alert('Invalid polynomial input.');
      }
    }
  };

  const startTraining = () => {
    if (!isRunning && !isPaused) {
      epochRef.current = 0;
      setIsRunning(true);
      workerRef.current.postMessage({
        type: 'train',
        payload: { layers, expression: polynomialExpr, startEpoch: 0, maxEpochs: 500 },
      });
    } else if (isPaused) {
      setIsRunning(true);
      setIsPaused(false);
      workerRef.current.postMessage({
        type: 'train',
        payload: { layers, expression: polynomialExpr, startEpoch: epochRef.current, maxEpochs: 500 },
      });
    } else {
      // Currently running → pause
      workerRef.current.postMessage({ type: 'stop' });
    }
  };

  const restartTraining = () => {
    workerRef.current.postMessage({ type: 'reset' });
    setIsRunning(false);
    setIsPaused(false);
    setApproxData([]);
    setWeights([]);
    setRMSE(null);
    epochRef.current = 0;
  };

  const updateLayer = (index, key, value) => {
    const newLayers = [...layers];
    newLayers[index][key] = value;
    setLayers(newLayers);
  };

  const addLayer = () => {
    if (layers.length < maxLayers) {
      setLayers([...layers, { nodes: 8, activation: 'relu' }]);
    }
  };

  const removeLayer = (index) => {
    if (layers.length > 1) {
      setLayers(layers.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <div
        style={{
          marginTop: '80px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'row',
          gap: '20px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Plot Area */}
        <div style={{ flex: 1, minWidth: '280px', width: '100%' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1f2937', marginBottom: '12px' }}>
            NN Approximation
          </h1>
          <PolynomialPlot polynomial={safePolynomial} approxData={approxData} />
        </div>

        {/* Controls */}
        <div
          style={{
            width: '300px',
            minWidth: '250px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            backgroundColor: '#f9f9f9',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <label>
            Polynomial (f(x)):
            <input
              type="text"
              value={polynomialInput}
              onChange={(e) => setPolynomialInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                marginLeft: '10px',
                padding: '5px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                width: '100%',
              }}
              disabled={isRunning || isPaused}
            />
          </label>

          <h2>Edit Neural Network</h2>
          {layers.map((layer, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <label>
                Layer {index + 1}:
                <input
                  type="number"
                  value={layer.nodes}
                  onChange={(e) =>
                    updateLayer(
                      index,
                      'nodes',
                      Math.min(Math.max(parseInt(e.target.value) || 1, 1), maxNodes)
                    )
                  }
                  style={{
                    marginLeft: '10px',
                    padding: '5px',
                    width: '60px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                  }}
                  disabled={isRunning || isPaused}
                />
              </label>
              <select
                value={layer.activation}
                onChange={(e) => updateLayer(index, 'activation', e.target.value)}
                style={{
                  marginLeft: '10px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                }}
                disabled={isRunning || isPaused}
              >
                <option value="relu">ReLU</option>
                <option value="sigmoid">Sigmoid</option>
                <option value="tanh">Tanh</option>
                <option value="linear">Linear</option>
              </select>
              <button
                onClick={() => removeLayer(index)}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                disabled={isRunning || isPaused}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addLayer}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: layers.length < maxLayers ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: layers.length < maxLayers ? 'pointer' : 'not-allowed',
            }}
            disabled={layers.length >= maxLayers || isRunning || isPaused}
          >
            Add Layer
          </button>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={startTraining}
              style={{
                padding: '10px 20px',
                backgroundColor: isRunning ? '#ffc107' : isPaused ? '#28a745' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              {isRunning ? 'Pause Training' : isPaused ? 'Resume Training' : 'Start Training'}
            </button>
            <button
              onClick={restartTraining}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Restart
            </button>
          </div>
          <h3>Current RMSE</h3>
          <div
            style={{
              backgroundColor: '#f0f0f0',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {rmseData
              ? `Epoch ${rmseData.epoch}: RMSE = ${rmseData.rmse.toFixed(4)}`
              : 'No data available'}
          </div>
        </div>
      </div>

      {/* Network Display */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
          NN Visualization
        </h2>
        <NeuralNetworkVisualizer layers={layers} weights={weights} isTraining={isRunning} />
      </div>
    </div>
  );
};

export default NNapproximation;
