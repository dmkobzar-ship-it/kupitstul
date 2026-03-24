"use client";

import { useEffect } from "react";

/**
 * Global Intersection Observer for scroll-reveal animations.
 * Add classes like `reveal`, `reveal-left`, `reveal-right`, `reveal-scale`, `stagger-children`
 * to any element and they will animate into view when scrolled onto screen.
 */
export default function RevealAnimations() {
  useEffect(() => {
    // Enable animations only after JS has loaded — prevents invisible SSR content
    document.body.classList.add("js-animations");

    const selectors =
      ".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    // Observe all current elements
    const elements = document.querySelectorAll(selectors);
    elements.forEach((el) => observer.observe(el));

    // Also observe dynamically added elements via MutationObserver
    const mutation = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches(selectors)) observer.observe(node);
            node
              .querySelectorAll(selectors)
              .forEach((el) => observer.observe(el));
          }
        });
      });
    });

    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
      document.body.classList.remove("js-animations");
    };
  }, []);

  return null;
}
