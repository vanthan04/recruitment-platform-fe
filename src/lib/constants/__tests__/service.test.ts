describe("BACKEND_URL", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws at import time when unset in production", () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.BACKEND_URL;

    // The throw happens at module-eval time (not inside a function this
    // module exports), so the module must be freshly (re-)required inside
    // the assertion itself — a static import would already have thrown, or
    // not, before this test body ever runs.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(() => require("@/lib/constants/service")).toThrow(/BACKEND_URL is required/);
  });

  it("does not throw when set in production", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      BACKEND_URL: "https://api.example.com",
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(() => require("@/lib/constants/service")).not.toThrow();
  });

  it("falls back to localhost without throwing outside production", () => {
    process.env = { ...originalEnv, NODE_ENV: "development" };
    delete process.env.BACKEND_URL;

    let mod: typeof import("@/lib/constants/service");
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require("@/lib/constants/service");
    }).not.toThrow();
    expect(mod!.BACKEND_URL).toBe("http://localhost:8080");
  });
});
