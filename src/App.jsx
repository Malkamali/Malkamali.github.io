import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
const NeuralLab = lazy(() => import("./pages/NeuralLab.jsx"));
const PendulumLab = lazy(() => import("./pages/PendulumLab.jsx"));
const CameraLab = lazy(() => import("./pages/CameraLab.jsx"));
const ClusteringLab = lazy(() => import("./pages/ClusteringLab.jsx"));
const titles = {
  "/": "Mohamed AlKamali — Research & Engineering",
  "/projects/nnapproximation":
    "Neural network approximation — Mohamed AlKamali",
  "/projects/doublependulum": "Double-pendulum dynamics — Mohamed AlKamali",
  "/projects/camera-geometry": "Camera geometry — Mohamed AlKamali",
  "/projects/clustering": "Clustering dynamics — Mohamed AlKamali",
};
function PageNavigation() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title =
      titles[pathname.replace(/\/$/, "") || "/"] ||
      "Page not found — Mohamed AlKamali";
    const path = pathname.replace(/\/$/, "") || "/";
    const canonical = `https://malkamali.github.io${path === "/projects/3dcube" ? "/projects/camera-geometry" : path}`;
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", canonical);
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute("content", canonical);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    if (titles[path])
      document
        .querySelector('meta[name="robots"][content="noindex"]')
        ?.remove();
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const element = document.getElementById(hash.slice(1));
        element?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
        element?.focus({ preventScroll: true });
      } else {
        window.scrollTo(0, 0);
        document.getElementById("main")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
function Header() {
  const [open, setOpen] = useState(false);
  const button = useRef();
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <div className="container nav-row">
        <Link className="wordmark" to="/">
          <span className="monogram" aria-hidden="true">
            m<span>k</span>
          </span>
          <span>
            Mohamed AlKamali
            <span className="wordmark-sub">Research & engineering</span>
          </span>
        </Link>
        <button
          className="menu-button"
          ref={button}
          aria-expanded={open}
          aria-controls="navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}{" "}
          <span aria-hidden="true">{open ? "×" : "+"}</span>
        </button>
        <nav
          id="navigation"
          aria-label="Main navigation"
          className={open ? "nav-links open" : "nav-links"}
        >
          <Link to="/#work">Research</Link>
          <Link to="/#interactive-demos">Demos</Link>
          <Link to="/#experience">Background</Link>
          <a className="nav-contact" href="mailto:mohamed.alkamali@outlook.com">
            Contact <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="container section">
        <h1>This demo couldn’t load.</h1>
        <p>Please reload to try again.</p>
        <button onClick={() => location.reload()}>Reload page</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>Research & engineering enquiries</h2>
          <a className="email-link" href="mailto:mohamed.alkamali@outlook.com">
            mohamed.alkamali@outlook.com ↗
          </a>
        </div>
        <div className="footer-meta">
          <a href="https://github.com/Malkamali">GitHub ↗</a>
          <p>
            Abu Dhabi, UAE
            <br />
            English · Arabic
          </p>
          <p>© {new Date().getFullYear()} Mohamed AlKamali</p>
        </div>
      </div>
    </footer>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <PageNavigation />
      <Header />
      <main id="main" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="container section" role="status">
                Loading demo…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects/nnapproximation" element={<NeuralLab />} />
              <Route
                path="/projects/doublependulum"
                element={<PendulumLab />}
              />
              <Route path="/projects/camera-geometry" element={<CameraLab />} />
              <Route path="/projects/clustering" element={<ClusteringLab />} />
              <Route
                path="/projects/3dcube"
                element={<Navigate to="/projects/camera-geometry" replace />}
              />
              <Route
                path="*"
                element={
                  <div className="container section">
                    <p className="eyebrow">404</p>
                    <h1>That page isn’t here.</h1>
                    <Link className="button" to="/">
                      Back to the portfolio
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
