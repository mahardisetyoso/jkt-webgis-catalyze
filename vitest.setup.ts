import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom has no matchMedia; stub it for components that read prefers-reduced-motion.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}
