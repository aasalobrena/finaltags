import { describe, expect, it } from "vitest";
import { navigationPath, pathFor, readRoute } from "../src/app/router";

describe("router", () => {
  it("reads the competition list from the GitHub Pages base path", () => {
    expect(readRoute("/finaltags/", "/finaltags/")).toEqual({ view: "list" });
  });

  it("reads the competition list when the base path has no trailing slash", () => {
    expect(readRoute("/finaltags", "/finaltags/")).toEqual({ view: "list" });
  });

  it("reads a printing route beneath the base path", () => {
    const route = readRoute(
      "/finaltags/Example_2026/printing",
      "/finaltags/",
    );
    expect(route).toEqual({
      competitionId: "Example_2026",
      view: "print",
    });
  });

  it("reads a configuration route beneath the base path", () => {
    expect(
      readRoute("/finaltags/Example_2026/configuration", "/finaltags/"),
    ).toEqual({
      competitionId: "Example_2026",
      view: "config",
    });
  });

  it("encodes competition ids when building a route", () => {
    expect(pathFor("A competition", "config", "/finaltags/")).toBe(
      "/finaltags/A%20competition/configuration",
    );
  });

  it("does not add the GitHub Pages base path twice during navigation", () => {
    expect(
      navigationPath("/finaltags/Example_2026/printing", "/finaltags/"),
    ).toBe("/finaltags/Example_2026/printing");
  });

  it("does not add the base path twice for a relative navigation", () => {
    expect(navigationPath("/Example_2026/printing", "/finaltags/")).toBe(
      "/finaltags/Example_2026/printing",
    );
  });

  it("keeps the root at the base path", () => {
    expect(navigationPath("/", "/finaltags/")).toBe("/finaltags/");
  });
});
