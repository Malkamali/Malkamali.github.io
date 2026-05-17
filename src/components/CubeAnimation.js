import React from 'react';

const CubeAnimation = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
    <style>{`
      .cube-scene {
        width: 120px;
        height: 120px;
        perspective: 400px;
        margin-bottom: 40px;
      }
      .cube {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        animation: spin 4s linear infinite;
      }
      @keyframes spin {
        from { transform: rotateX(0deg) rotateY(0deg); }
        to   { transform: rotateX(360deg) rotateY(360deg); }
      }
      .face {
        position: absolute;
        width: 120px;
        height: 120px;
        border: 2px solid #555;
        opacity: 0.85;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        color: #fff;
      }
      .front  { background: rgba(59,130,246,0.6);  transform: translateZ(60px); }
      .back   { background: rgba(16,185,129,0.6);  transform: rotateY(180deg) translateZ(60px); }
      .left   { background: rgba(245,158,11,0.6);  transform: rotateY(-90deg) translateZ(60px); }
      .right  { background: rgba(239,68,68,0.6);   transform: rotateY(90deg)  translateZ(60px); }
      .top    { background: rgba(139,92,246,0.6);  transform: rotateX(90deg)  translateZ(60px); }
      .bottom { background: rgba(236,72,153,0.6);  transform: rotateX(-90deg) translateZ(60px); }
    `}</style>
    <div className="cube-scene">
      <div className="cube">
        <div className="face front" />
        <div className="face back" />
        <div className="face left" />
        <div className="face right" />
        <div className="face top" />
        <div className="face bottom" />
      </div>
    </div>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>3D Cube Animation</h2>
    <p style={{ color: '#666' }}>CSS 3D perspective transform — six coloured faces, continuous rotation.</p>
  </div>
);

export default CubeAnimation;
