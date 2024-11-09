import React, { useState, useRef, useEffect } from "react";
import Sketch from "react-p5";
import Navbar from "../components/Navbar"; // Use your shared Navbar component


const radToDeg = (radians) => (radians * 180) / Math.PI;
const degToRad = (degrees) => (degrees * Math.PI) / 180;

const DoublePendulum = () => {
  const [r1, setR1] = useState(0.5);
  const [r2, setR2] = useState(0.5);
  const [m1, setM1] = useState(0.5);
  const [m2, setM2] = useState(0.5);
  const [angle1, setAngle1] = useState(45); // Angle in degrees
  const [angle2, setAngle2] = useState(45); // Angle in degrees
  const [running, setRunning] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });

  const g = 9.81; // Fixed gravity

  const q1Ref = useRef(degToRad(angle1));
  const q2Ref = useRef(degToRad(angle2));
  const p1Ref = useRef(0);
  const p2Ref = useRef(0);

  const trace1 = useRef([]);
  const trace2 = useRef([]);
  const maxTraceLength = 500;

  useEffect(() => {
    const updateCanvasSize = () => {
      const size = Math.min(window.innerWidth * 0.9, 600);
      setCanvasSize({ width: size, height: size });
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(canvasSize.width, canvasSize.height).parent(canvasParentRef);
    p5.frameRate(60);
  };

  const draw = (p5) => {
    p5.background(240);
    p5.translate(canvasSize.width / 2, canvasSize.height / 3);

    const q1 = q1Ref.current;
    const q2 = q2Ref.current;

    const x1 = r1 * Math.sin(q1) * (canvasSize.height / 3);
    const y1 = r1 * Math.cos(q1) * (canvasSize.height / 3);
    const x2 = x1 + r2 * Math.sin(q2) * (canvasSize.height / 3);
    const y2 = y1 + r2 * Math.cos(q2) * (canvasSize.height / 3);

    p5.stroke(0);
    p5.line(0, 0, x1, y1);
    p5.ellipse(x1, y1, 10);

    p5.line(x1, y1, x2, y2);
    p5.ellipse(x2, y2, 10);

    if (running) {
      trace1.current.push({ x: x1, y: y1 });
      trace2.current.push({ x: x2, y: y2 });

      if (trace1.current.length > maxTraceLength) trace1.current.shift();
      if (trace2.current.length > maxTraceLength) trace2.current.shift();

      p5.stroke(255, 0, 0);
      for (let i = 1; i < trace1.current.length; i++) {
        p5.line(
          trace1.current[i - 1].x,
          trace1.current[i - 1].y,
          trace1.current[i].x,
          trace1.current[i].y
        );
      }

      p5.stroke(0, 255, 0);
      for (let i = 1; i < trace2.current.length; i++) {
        p5.line(
          trace2.current[i - 1].x,
          trace2.current[i - 1].y,
          trace2.current[i].x,
          trace2.current[i].y
        );
      }

      updatePhysics(p5.deltaTime / 2000); // Real-time physics update
    }
  };

  const updatePhysics = (dt) => {
    const q1 = q1Ref.current;
    const q2 = q2Ref.current;
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;

    const cos = Math.cos(q1 - q2);
    const sin = Math.sin(q1 - q2);
    const denom = m2 * r1 ** 2 * r2 ** 2 * (m1 + m2 * sin ** 2);

    const dq1 = ((p1 * r2 - p2 * r1 * cos) * r2) / denom;
    const dq2 = ((p2 * (m1 + m2) * r1 - p1 * m2 * r2 * cos) * r1) / denom;

    const dp1 = -((m1 + m2) * g * r1 * Math.sin(q1) + dq1 * dq2 * m2 * r1 * r2 * sin);
    const dp2 = -(m2 * g * r2 * Math.sin(q2) - dq1 * dq2 * m2 * r1 * r2 * sin);

    q1Ref.current += dq1 * dt;
    q2Ref.current += dq2 * dt;
    p1Ref.current += dp1 * dt;
    p2Ref.current += dp2 * dt;
  };

  const toggleSimulation = () => {
    if (running) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  const startSimulation = () => {
    setRunning(true);
  };

  const stopSimulation = () => {
    setRunning(false);
    resetSimulation();
  };

  const resetSimulation = () => {
    q1Ref.current = degToRad(angle1);
    q2Ref.current = degToRad(angle2);
    p1Ref.current = 0;
    p2Ref.current = 0;
    trace1.current = [];
    trace2.current = [];
  };

  return (
    <div>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          justifyContent: "center",
          padding: "20px",
          marginTop: "60px",
        }}
      >
        <Sketch setup={setup} draw={draw} style={{ flex: 1, border: "1px solid #ccc" }} />
        <div
          className="controls"
          style={{
            marginLeft: window.innerWidth < 768 ? "0" : "20px",
            marginTop: window.innerWidth < 768 ? "20px" : "0",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            alignItems: "flex-start",
            width: "300px",
          }}
        >
          {[
            {
              label: "Rod 1 Length",
              value: r1,
              onChange: setR1,
              min: 0.1,
              max: 1,
              step: 0.1,
            },
            {
              label: "Rod 2 Length",
              value: r2,
              onChange: setR2,
              min: 0.1,
              max: 1,
              step: 0.1,
            },
            {
              label: "Mass 1",
              value: m1,
              onChange: setM1,
              min: 0.1,
              max: 1,
              step: 0.1,
            },
            {
              label: "Mass 2",
              value: m2,
              onChange: setM2,
              min: 0.1,
              max: 1,
              step: 0.1,
            },
            {
              label: "Angle 1 (°)",
              value: angle1,
              onChange: (val) => {
                setAngle1(val);
                q1Ref.current = degToRad(val);
              },
              min: 0,
              max: 180,
              step: 1,
            },
            {
              label: "Angle 2 (°)",
              value: angle2,
              onChange: (val) => {
                setAngle2(val);
                q2Ref.current = degToRad(val);
              },
              min: 0,
              max: 180,
              step: 1,
            },
          ].map(({ label, value, onChange, min, max, step }, idx) => (
            <div key={idx} style={{ width: "100%" }}>
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                {label}:
                <input
                  type="number"
                  value={value}
                  onChange={(e) => {
                    const val = Math.max(min, Math.min(max, Number(e.target.value)));
                    onChange(val);
                  }}
                  style={{
                    width: "80px",
                    marginLeft: "10px",
                    padding: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                  disabled={running}
                />
              </label>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange(val);
                }}
                disabled={running}
                style={{ width: "100%" }}
              />
            </div>
          ))}

          <button
            onClick={toggleSimulation}
            style={{
              padding: "10px 20px",
              backgroundColor: running ? "#dc3545" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
              width: "100%",
              textAlign: "center",
            }}
          >
            {running ? "Stop" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoublePendulum;
