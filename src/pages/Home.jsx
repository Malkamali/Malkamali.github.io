import React, { useRef } from "react";
import ScrollHero from "../components/ScrollHero.jsx";
import useScrollReveals from "../lib/useScrollReveals.js";
import "./Home.css";
import { Link } from "react-router-dom";
function Preview({ type = "neural" }) {
  const grid = React.useId();
  return (
    <svg
      viewBox="0 0 520 280"
      aria-hidden="true"
      className={`preview preview-${type}`}
    >
      <defs>
        <pattern id={grid} width="26" height="26" patternUnits="userSpaceOnUse">
          <path
            d="M26 0H0V26"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".1"
          />
        </pattern>
      </defs>
      <rect width="520" height="280" fill={`url(#${grid})`} />
      {type === "neural" ? (
        <>
          <path
            d="M45 220C120 40 175 38 245 138S365 240 475 45"
            className="preview-line"
          />
          <path
            d="M45 229L86 146 135 81 179 72 227 107 274 163 319 197 365 184 415 133 475 52"
            fill="none"
            stroke="var(--orange)"
            strokeWidth="3"
            strokeDasharray="7 5"
          />
          <text x="36" y="34">
            f(x) → ŷ
          </text>
        </>
      ) : type === "pendulum" ? (
        <>
          <path d="M260 55L340 132 219 201" className="preview-line" />
          <path
            d="M260 55L343 129 239 211"
            fill="none"
            stroke="var(--orange)"
            strokeDasharray="6 4"
            strokeWidth="2"
          />
          <path
            d="M200 221C460 232 411 93 314 104S120 164 219 201"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".3"
          />
          <circle cx="260" cy="55" r="5" fill="currentColor" />
          <circle
            cx="340"
            cy="132"
            r="9"
            fill="var(--surface)"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle cx="219" cy="201" r="11" fill="currentColor" />
          <text x="36" y="34">
            δθ = 0.1°
          </text>
        </>
      ) : type === "clustering" ? (
        <>
          {[
            [140, 90],
            [365, 95],
            [250, 215],
          ].map(([cx, cy], cluster) => (
            <g
              key={cluster}
              style={{
                color: ["var(--accent)", "var(--orange)", "#b5b0ff"][cluster],
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r="62"
                fill="currentColor"
                opacity=".07"
              />
              {Array.from({ length: 38 }, (_, i) => {
                const angle = i * 2.4,
                  radius = 8 + Math.sqrt(i / 38) * 53;
                return (
                  <circle
                    key={i}
                    cx={cx + Math.cos(angle) * radius}
                    cy={cy + Math.sin(angle) * radius * 0.65}
                    r="2.8"
                    fill="currentColor"
                  />
                );
              })}
              <path
                d={`M${cx - 52} ${cy + 27}L${cx - 19} ${cy + 10}L${cx} ${cy}`}
                fill="none"
                stroke="currentColor"
                strokeDasharray="4 4"
              />
              <circle
                cx={cx}
                cy={cy}
                r="9"
                fill="var(--surface)"
                stroke="currentColor"
                strokeWidth="2"
              />
            </g>
          ))}
          <text x="36" y="34">
            Assign → update → repeat
          </text>
        </>
      ) : (
        <>
          <path
            d="M105 165L202 62 400 104 310 210Z M202 62L202 170 310 240 310 210 M105 165L202 170 M400 104L400 202 310 240"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M62 214L202 62 M62 214L400 104 M62 214L310 240"
            stroke="var(--orange)"
            strokeDasharray="5 4"
            fill="none"
          />
          <circle cx="62" cy="214" r="6" fill="var(--orange)" />
          <text x="36" y="34">
            x ∼ K [R | t] X
          </text>
        </>
      )}
    </svg>
  );
}
const demos = [
  {
    type: "neural",
    number: "01",
    tag: "Machine learning",
    title: "Neural network approximation",
    text: "Train a neural network to approximate a function. Compare model capacity, observation noise, and held-out error.",
    path: "/projects/nnapproximation",
    meta: "Function approximation · Seeded training",
  },
  {
    type: "pendulum",
    number: "02",
    tag: "Physics & simulation",
    title: "Double-pendulum dynamics",
    text: "Compare trajectories under perturbed initial conditions, with energy conservation and phase-space diagnostics.",
    path: "/projects/doublependulum",
    meta: "Nonlinear dynamics · Numerical methods",
  },
  {
    type: "camera",
    number: "03",
    tag: "Computer vision",
    title: "Camera geometry",
    text: "Examine how camera pose, focal length, and projection models map a 3D target to image coordinates.",
    path: "/projects/camera-geometry",
    meta: "Projective geometry · Camera models",
  },
  {
    type: "clustering",
    number: "04",
    tag: "Unsupervised learning",
    title: "Clustering dynamics",
    text: "Follow k-means from random centroids to stable groups. Compare assignments, centroid paths, and sensitivity to initialization.",
    path: "/projects/clustering",
    meta: "Random initialization · Voronoi regions",
  },
];
export default function Home() {
  const root = useRef(null);
  useScrollReveals(root);
  return (
    <div className="home" ref={root}>
      <section className="container home-intro">
        <p className="eyebrow">Mohamed AlKamali / Researcher & ML engineer</p>
        <h1>
          Machine learning &
          <br />
          <span>physical systems</span>
        </h1>
        <div className="intro-bottom">
          <p>
            My work focuses on machine learning, computer vision, and numerical
            modelling for physical systems.
          </p>
          <div className="actions">
            <a className="button" href="#interactive-demos">
              View demos <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#work">
              Research background
            </a>
          </div>
        </div>
        <div className="intro-caption">
          <span>Based in Abu Dhabi, UAE</span>
          <span>
            Selected work below <span aria-hidden="true">↓</span>
          </span>
        </div>
      </section>
      <section id="work" tabIndex={-1} className="section research-section">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">01 / Research</p>
              <h2>Research areas</h2>
            </div>
            <p>
              Research experience in computer vision, optical sensing, and
              statistical evaluation of learning systems.
            </p>
          </div>
          <div className="research-grid">
            <article data-reveal>
              <span className="research-index">I.</span>
              <h3>Vision & control</h3>
              <p>
                At the Technology Innovation Institute, I develop AI models for
                physical applications and real-time controllers that combine
                computer vision with learning algorithms.
              </p>
              <span className="topic">Computer vision / Physical systems</span>
            </article>
            <article data-reveal>
              <span className="research-index">II.</span>
              <h3>Optical sensing</h3>
              <p>
                My physics research explored numerical modelling of fiber Bragg
                gratings for sensing temperature and stress, connecting optical
                behaviour to physical measurements.
              </p>
              <span className="topic">Photonics / Numerical modelling</span>
            </article>
            <article data-reveal>
              <span className="research-index">III.</span>
              <h3>Learning & evaluation</h3>
              <p>
                My computer science research examined statistical and runtime
                trade-offs between training time and sample size.
              </p>
              <span className="topic">Machine learning / Data analysis</span>
            </article>
          </div>
        </div>
      </section>
      <ScrollHero>
        <div className="project-grid">
          {demos.map((d) => (
            <article
              className={
                d.type === "clustering" ? "project project-featured" : "project"
              }
              key={d.number}
              data-reveal
              style={{ "--reveal-delay": `${(Number(d.number) - 1) * 90}ms` }}
            >
              <Link tabIndex={-1} aria-hidden="true" to={d.path}>
                <Preview type={d.type} />
              </Link>
              <div className="project-body">
                <p className="eyebrow">
                  {d.number} / {d.tag}
                </p>
                <h3>
                  <Link to={d.path}>{d.title}</Link>
                </h3>
                <p>{d.text}</p>
                <span className="project-meta">{d.meta}</span>
                <Link
                  className="project-action"
                  to={d.path}
                  aria-label={`Open demo: ${d.title}`}
                >
                  Open demo <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </ScrollHero>
      <section
        id="experience"
        tabIndex={-1}
        className="section background-section"
      >
        <div className="container background-grid">
          <div data-reveal>
            <p className="eyebrow">03 / Background</p>
            <h2>Experience & education</h2>
            <p>
              Graduate training in computer science and physics, following a
              degree in mechanical engineering.
            </p>
            <p className="skills-line">
              Python · C++ · TensorFlow · PyTorch
              <br />
              MATLAB · SQL · Git · Linux
            </p>
          </div>
          <div>
            <h3 className="small-heading">Experience</h3>
            <div className="timeline">
              <article data-reveal>
                <time>2020 — Present</time>
                <h4>Researcher</h4>
                <p>Technology Innovation Institute · Abu Dhabi</p>
              </article>
              <article data-reveal>
                <time>2019 — 2020</time>
                <h4>Intern</h4>
                <p>Human Resources Authority · Data pipelines & BI</p>
              </article>
            </div>
            <h3 id="education" className="small-heading">
              Education
            </h3>
            <div className="timeline">
              <article data-reveal>
                <time>2022</time>
                <h4>Master’s in Physics</h4>
                <p>Belarusian State University · GPA 3.77 / 4.00</p>
              </article>
              <article data-reveal>
                <time>2020</time>
                <h4>Master’s in Computer Science & Engineering</h4>
                <p>Pennsylvania State University · GPA 3.90 / 4.00</p>
              </article>
              <article data-reveal>
                <time>2018</time>
                <h4>B.Sc. in Mechanical Engineering</h4>
                <p>Pennsylvania State University · GPA 3.82 / 4.00</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
