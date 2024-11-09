import React, { useLayoutEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NeuralNetworkVisualizer = ({ layers, weights }) => {
  const containerRef = useRef(null);
  const [nodePositions, setNodePositions] = useState([]);
  const maxNodesForLines = 15; // Threshold for total nodes to show lines and weights

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const updatePositions = useCallback(() => {
    if (!containerRef.current) return;

    const positions = Array.from(containerRef.current.children).map((layer) =>
      Array.from(layer.children)
        .filter((child) => child.classList.contains('node'))
        .map((node) => {
          const rect = node.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
          };
        })
    );

    setNodePositions(positions);
  }, []);

  const updatePositionsDebounced = useCallback(debounce(updatePositions, 100), [updatePositions]);

  useLayoutEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositionsDebounced);
    return () => window.removeEventListener('resize', updatePositionsDebounced);
  }, [updatePositionsDebounced, layers]);

  const extendedLayers = [
    { nodes: 1, activation: 'input' }, // Input layer
    ...layers,
    { nodes: 1, activation: 'output' }, // Output layer
  ];

  const totalNodes = extendedLayers.reduce((sum, layer) => sum + layer.nodes, 0);
  const shouldDrawLines = totalNodes <= maxNodesForLines;

  const layerLabels = generateLayerLabels(extendedLayers);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10vw',
        marginTop: '20px',
        minHeight: '60vh',
        position: 'relative',
        width: '100%',
        overflowX: 'auto',
      }}
    >
      {extendedLayers.map((layer, layerIndex) => (
        <motion.div
          key={layerIndex}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            gap: '20px',
          }}
          onLayoutAnimationComplete={updatePositions}
        >
          <h4 style={{ fontSize: '1rem' }}>{layerLabels[layerIndex]}</h4>
          <AnimatePresence onExitComplete={updatePositions}>
            {Array.from({ length: layer.nodes }).map((_, nodeIndex) => (
              <motion.div
                key={nodeIndex}
                className="node"
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'gray',
                  margin: '5px 0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Render connections only if total nodes <= maxNodesForLines */}
      {shouldDrawLines && (
        <svg
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          {nodePositions.length > 1 &&
            nodePositions.slice(0, -1).map((layer, layerIndex) =>
              layer.map((startNode, startIndex) =>
                nodePositions[layerIndex + 1]?.map((endNode, endIndex) => {
                  const weight = weights[layerIndex]?.[startIndex]?.[endIndex] ?? 0;

                  return (
                    <React.Fragment key={`line-${layerIndex}-${startIndex}-${endIndex}`}>
                      <motion.line
                        x1={startNode.x}
                        y1={startNode.y}
                        x2={endNode.x}
                        y2={endNode.y}
                        stroke="black"
                        strokeWidth="1.1"
                        initial={{ opacity: 0, pathLength: 0 }}
                        animate={{ opacity: 1, pathLength: 1 }}
                        exit={{ opacity: 0, pathLength: 0 }}
                      />
                      <motion.text
                        x={startNode.x + (endNode.x - startNode.x) * 0.2}
                        y={startNode.y + (endNode.y - startNode.y) * 0.2}
                        fontSize="12"
                        fill="blue"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {typeof weight === 'number' ? weight.toFixed(2) : 'N/A'}
                      </motion.text>
                    </React.Fragment>
                  );
                })
              )
            )}
        </svg>
      )}
    </div>
  );
};

const generateLayerLabels = (layers) => {
  const activationCounts = {};
  return layers.map((layer, index) => {
    if (index === 0) return 'x';
    if (index === layers.length - 1) return 'y';
    const { activation } = layer;
    if (!activationCounts[activation]) {
      activationCounts[activation] = 1;
    } else {
      activationCounts[activation] += 1;
    }
    return `${capitalize(activation)} ${activationCounts[activation]}`;
  });
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default NeuralNetworkVisualizer;
