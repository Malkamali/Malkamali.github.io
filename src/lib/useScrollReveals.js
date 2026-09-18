import { useEffect } from "react";

// Progressive enhancement: content is visible unless the observer is available.
// Reveal once, and never leave a keyboard-focused element transparent.
export default function useScrollReveals(root) {
  useEffect(() => {
    const scope = root.current;
    if (!scope || !("IntersectionObserver" in window)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const elements = [...scope.querySelectorAll("[data-reveal]")];
    let observer;
    function reveal(element) {
      element.classList.add("is-visible");
      element.dataset.revealed = "true";
      observer?.unobserve(element);
    }
    function configure() {
      observer?.disconnect();
      if (preference.matches) {
        elements.forEach(reveal);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
      );
      elements.forEach((element) => {
        if (
          element.dataset.revealed ||
          element.getBoundingClientRect().top < innerHeight * 0.9
        )
          reveal(element);
        else {
          element.classList.add("reveal-ready");
          observer.observe(element);
        }
      });
    }
    const focus = (event) => {
      const element = event.target.closest("[data-reveal]");
      if (element) reveal(element);
    };
    configure();
    preference.addEventListener("change", configure);
    scope.addEventListener("focusin", focus);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configure);
      scope.removeEventListener("focusin", focus);
      elements.forEach((element) =>
        element.classList.remove("reveal-ready", "is-visible"),
      );
    };
  }, [root]);
}
