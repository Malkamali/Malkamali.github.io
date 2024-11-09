import React, { useState, useCallback, useRef } from 'react';
import { evaluate } from 'mathjs';
import PolynomialPlot from '../utils/PolynomialPlot';
import NeuralNetworkVisualizer from '../utils/NeuralNetworkVisualizer';
import trainModel, { resetModel } from '../utils/trainModel';
import Navbar from '../components/Navbar';

const NNapproximation = () => {
  const [layers, setLayers] = useState([
    { nodes: 3, activation: 'relu' },
    { nodes: 3, activation: 'relu' },
  ]);
  const [weights, setWeights] = useState([]);
  const [rmseData, setRMSE] = useState([]); // Store RMSE values
  const [approxData, setApproxData] = useState([]);
  const [polynomialInput, setPolynomialInput] = useState('3*x^3 - 2*x + 1');
  const [polynomial, setPolynomial] = useState(() => (x) => 3 * x ** 3 - 2 * x + 1);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const trainingRef = useRef(false);

  const maxLayers = 4;
  const maxNodes = 10;

  const safePolynomial = useCallback((x) => polynomial(x), [polynomial]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      try {
        const parsedFunction = (x) => evaluate(polynomialInput, { x });
        setPolynomial(() => parsedFunction);
      } catch (error) {
        alert('Invalid polynomial input.');
      }
    }
  };

  const startTraining = async () => {
    if (!isRunning && !isPaused) {
      trainingRef.current = true;
      setIsRunning(true);
      const lastEpoch = await trainModel(
        polynomial,
        setApproxData,
        layers,
        trainingRef,
        currentEpoch,
        500,
        setCurrentEpoch,
        setWeights,
        setRMSE // Pass RMSE setter
      );
      setCurrentEpoch(lastEpoch);
      setIsRunning(false);
    } else if (isPaused) {
      trainingRef.current = true;
      setIsRunning(true);
      setIsPaused(false);
      const lastEpoch = await trainModel(
        polynomial,
        setApproxData,
        layers,
        trainingRef,
        currentEpoch,
        500,
        setCurrentEpoch,
        setWeights
      );
      setCurrentEpoch(lastEpoch);
      setIsRunning(false);
    } else {
      trainingRef.current = false;
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  const restartTraining = () => {
    resetModel();
    trainingRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setApproxData([]);
    setCurrentEpoch(0);
    setWeights([]); // Reset weights
    setRMSE([]); // Reset RMSE
  };

  const updateLayer = (index, key, value) => {
    const newLayers = [...layers];
    newLayers[index][key] = value;
    setLayers(newLayers);
  };

  const addLayer = () => {
    if (layers.length < maxLayers) {
      setLayers([...layers, { nodes: 3, activation: 'relu' }]);
    }
  };

  const removeLayer = (index) => {
    if (layers.length > 1) {
      setLayers(layers.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <Navbar />
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
        <div style={{ flex: 1, minWidth: '400px' }}>
          <h1>Neural Network Approximation</h1>
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
              disabled={layers.length === 1 || isRunning || isPaused} // Disable if only one layer or during training
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
            {rmseData.length > 0
              ? `Epoch ${rmseData[rmseData.length - 1].epoch}: RMSE = ${rmseData[rmseData.length - 1].rmse.toFixed(4)}`
              : 'No data available'}
          </div>
        </div>
      </div>

      {/* Network Display */}
      <div style={{ marginTop: '40px' }}>
        <h2>Neural Network Visualization</h2>
        <NeuralNetworkVisualizer layers={layers} weights={weights} />
      </div>
    </div>
  );
};

export default NNapproximation;
