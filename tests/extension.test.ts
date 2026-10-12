import { describe, expect, it } from "vitest";
import { buildCompetitionExtensions } from "../src/domain/extension";
import type { CustomTagsConfig } from "../src/types/domain";

describe("competition extension", () => {
  it("stores multiple custom event tag configurations", () => {
    const customTags: CustomTagsConfig[] = [
      {
        name: "3x3 finalists",
        competitionLogoUrl: "",
        eventId: "333",
        eventLogoUrl: "",
        competitors: [],
      },
      {
        name: "Unofficial event",
        competitionLogoUrl: "",
        eventId: "custom",
        eventLogoUrl: "https://example.com/event.png",
        competitors: [],
      },
    ];

    const extensions = buildCompetitionExtensions(
      { extensions: [] },
      {
        region: { type: "world", id: "", prioritizeLocals: false },
        paperSize: "a4",
        customTags,
      },
    );

    expect(extensions).toHaveLength(1);
    expect(extensions[0]).toMatchObject({
      data: { customTags },
    });
  });
});
