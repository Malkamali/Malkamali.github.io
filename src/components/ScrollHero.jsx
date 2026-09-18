import React, { useEffect, useRef } from "react";

export default function ScrollHero({ children }) {
  const section = useRef(null);
  useEffect(() => {
    const element = section.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 760px)");
    let frame = 0,
      start = 0,
      distance = 1,
      active = true;
    function update() {
      frame = 0;
      const progress = preference.matches
        ? 1
        : Math.max(0, Math.min(1, (scrollY - start) / distance));
      const minimum = mobile.matches ? 0.96 : 0.84;
      element.style.setProperty(
        "--hero-scale",
        String(minimum + (1 - minimum) * progress),
      );
      element.style.setProperty("--hero-radius", `${28 - 20 * progress}px`);
      element.dataset.progress = progress.toFixed(3);
    }
    function schedule() {
      if (!frame && active) frame = requestAnimationFrame(update);
    }
    function measure() {
      start = element.getBoundingClientRect().top + scrollY - innerHeight * 0.9;
      distance = innerHeight * (mobile.matches ? 0.5 : 0.7);
      update();
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) schedule();
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    measure();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", measure);
    preference.addEventListener("change", measure);
    mobile.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      removeEventListener("scroll", schedule);
      removeEventListener("resize", measure);
      preference.removeEventListener("change", measure);
      mobile.removeEventListener("change", measure);
    };
  }, []);
  return (
    <section
      id="interactive-demos"
      tabIndex={-1}
      ref={section}
      className="zoom-section"
      aria-labelledby="demos-title"
    >
      <div className="zoom-panel">
        <div className="demo-content">
          <header className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">02 / Learning · Dynamics · Geometry</p>
              <h2 id="demos-title">Interactive demos</h2>
            </div>
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}
