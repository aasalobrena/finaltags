import { describe, expect, it } from "vitest";
import {
  countryName,
  escapeHtml,
  flagUrl,
  formatDate,
} from "../src/ui/html";

describe("HTML helpers", () => {
  it("escapes characters that can form HTML markup", () => {
    expect(escapeHtml(`<tag title="x">&'`)).toBe(
      "&lt;tag title=&quot;x&quot;&gt;&amp;&#039;",
    );
  });

  it("builds country flag URLs from lowercase country codes", () => {
    expect(flagUrl("ES")).toBe("https://flagcdn.com/w160/es.png");
    expect(flagUrl("")).toBe("");
  });

  it("returns an empty country name when no country code is provided", () => {
    expect(countryName()).toBe("");
  });

  it("formats valid dates and preserves invalid input", () => {
    expect(formatDate("2026-10-04")).toBe("Oct 4, 2026");
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(formatDate()).toBe("");
  });
});
