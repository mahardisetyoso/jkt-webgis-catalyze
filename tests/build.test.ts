import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nextConfig from "../next.config.mjs";

describe("project scaffold", () => {
  it("next.config exports a static export", () => {
    expect(nextConfig.output).toBe("export");
  });

  it("package.json defines build, dev, and test scripts", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf-8"),
    );
    expect(pkg.scripts.build).toBeTruthy();
    expect(pkg.scripts.dev).toBeTruthy();
    expect(pkg.scripts.test).toBeTruthy();
  });
});
