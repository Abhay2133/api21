import { describe, expect, test } from "bun:test";
import router from "../../src/routes/health.routes";

describe("health.routes", () => {
  test("should register GET / route", () => {
    // Express router stores registered layers in router.stack
    const routeLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === "/"
    );

    expect(routeLayer).toBeDefined();
    expect(routeLayer?.route?.methods?.get).toBe(true);
    expect(routeLayer?.route?.stack[0].handle.name).toBe("healthCheck");
  });
});
