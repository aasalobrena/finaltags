import { describe, expect, it } from "vitest";
import { renderCustomFoldTag } from "../src/components/printTag";
import type { CustomTagsConfig } from "../src/types/domain";

describe("custom tags", () => {
  it("renders custom data on both sides and escapes user-provided content", () => {
    const config: CustomTagsConfig = {
      name: "Custom event",
      competitionLogoUrl: "https://example.com/competition.png",
      eventId: "custom",
      eventLogoUrl: "https://example.com/event.png",
      competitors: [],
    };
    const tag = renderCustomFoldTag(
      {
        personId: "custom",
        name: "<Competitor>",
        flag: "custom",
        flagUrl: "https://example.com/flag.png",
        seed: "1",
        result: "12.34",
      },
      config,
    );

    expect(tag.match(/<article class="fold-tag">/g)).toHaveLength(1);
    expect(tag.match(/<div class="tag-name">&lt;Competitor&gt;<\/div>/g))
      .toHaveLength(2);
    expect(tag.match(/12\.34/g)).toHaveLength(2);
    expect(tag.match(/https:\/\/example\.com\/flag\.png/g)).toHaveLength(2);
    expect(tag).toContain("Custom event logo");
    expect(tag).toContain("Competition logo");
    expect(tag).not.toContain("<Competitor>");
  });

  it("keeps an explicitly empty flag unflagged", () => {
    const tag = renderCustomFoldTag(
      {
        personId: "123",
        name: "Ada Example",
        flag: "",
        flagUrl: "",
        seed: "1",
        result: "12.34",
      },
      {
        name: "3x3",
        competitionLogoUrl: "",
        eventId: "333",
        eventLogoUrl: "",
        competitors: [],
      },
    );

    expect(tag).not.toContain("<img");
  });
});
