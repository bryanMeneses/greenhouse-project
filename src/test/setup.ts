import "@testing-library/jest-dom/vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";

expect.extend(axeMatchers);

// jsdom lacks the layout/pointer APIs Radix primitives (e.g. Tooltip) probe for
// positioning. Shim them so vendored shadcn components render under test.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= vi.fn();

afterEach(() => {
  cleanup();
});
