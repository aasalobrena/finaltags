import { describe, expect, it } from "vitest";
import type { EventId } from "../src/types/wcif";
import { formatResult } from "../src/domain/results";

describe("formatResult", () => {
  it("uses a dash for missing or zero results", () => {
    expect(formatResult("333" as EventId)).toBe("-");
    expect(formatResult("333" as EventId, 0)).toBe("-");
  });

  it("formats numeric event results as numbers", () => {
    expect(formatResult("333fm" as EventId, 30)).toBe("30");
  });
});
