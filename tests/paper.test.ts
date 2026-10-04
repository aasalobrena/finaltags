import { describe, expect, it } from "vitest";
import { getPaperSize, paperSizes } from "../src/domain/paper";

describe("paper size helpers", () => {
  it("uses A4 as the default for missing or unsupported values", () => {
    expect(getPaperSize(undefined)).toBe("a4");
    expect(getPaperSize("a4")).toBe("a4");
  });

  it("supports letter paper", () => {
    expect(getPaperSize("letter")).toBe("letter");
    expect(paperSizes.letter.cssName).toBe("letter");
  });
});
