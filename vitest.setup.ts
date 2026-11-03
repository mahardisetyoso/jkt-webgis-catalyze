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

// jsdom defines scrollTo but only logs "Not implemented"; replace it with a no-op.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
