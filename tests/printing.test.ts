import { afterEach, describe, expect, it, vi } from "vitest";
import { renderCustomTags } from "../src/views/customTags";
import { renderPrinting } from "../src/views/printing";
import {
  createInitialCustomTags,
  createInitialState,
} from "../src/app/state";
import type { AppState } from "../src/types/app";
import type { WcifWithParticipation } from "../src/types/wcif";

afterEach(() => {
  vi.unstubAllGlobals();
});

const createState = (): AppState => ({
  token: "token",
  competitions: [],
  countries: [],
  psychSheets: {},
  competition: { id: "Example_2026", name: "Example competition" },
  canConfigureCompetition: true,
  wcif: {
    events: [],
    persons: [],
    extensions: [],
  } as unknown as WcifWithParticipation,
  view: "print",
  selectedEventIds: [],
  customTags: [
    {
      name: "Side event",
      competitionLogoUrl: "",
      eventId: "custom",
      eventLogoUrl: "https://example.com/event.png",
      competitors: [
        {
          personId: "custom",
          name: "Custom competitor",
          flag: "",
          flagUrl: "",
          seed: "1",
          result: "12.34",
        },
      ],
    },
  ],
  selectedCustomTagIndex: 0,
  selectedCustomTagIndexes: [0],
});

describe("custom tag printing", () => {
  it("selects and previews custom tag sets in Printing", () => {
    vi.stubGlobal("document", {
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue({}),
      head: { append: vi.fn() },
    });
    const app = { innerHTML: "" } as HTMLElement;

    renderPrinting(app, createState());

    expect(app.innerHTML).toContain('name="customTag" value="0" checked');
    expect(app.innerHTML).toContain("Side event");
    expect(app.innerHTML).toContain("event-option__custom-logo");
    expect(app.innerHTML).toContain("Custom competitor");
  });

  it("uses WCA event icons for named custom tag sets", () => {
    vi.stubGlobal("document", {
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue({}),
      head: { append: vi.fn() },
    });
    const app = { innerHTML: "" } as HTMLElement;
    const state = createState();
    state.customTags[0]!.eventId = "333";
    state.customTags[0]!.eventLogoUrl = "";

    renderPrinting(app, state);

    expect(app.innerHTML).toContain("cubing-icon event-333");
  });

  it("does not offer the empty starter tag set for printing", () => {
    vi.stubGlobal("document", {
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue({}),
      head: { append: vi.fn() },
    });
    const app = { innerHTML: "" } as HTMLElement;
    const state = createState();
    state.customTags[0]!.competitors[0]!.name = "";

    renderPrinting(app, state);

    expect(app.innerHTML).not.toContain('name="customTag"');
    expect(app.innerHTML).not.toContain("<h2>Custom tag sets</h2>");
  });

  it("keeps the Custom tags tab for configuration only", () => {
    const app = { innerHTML: "" } as HTMLElement;
    const state = createState();
    state.view = "tags";

    renderCustomTags(app, state);

    expect(app.innerHTML).not.toContain("print-preview");
    expect(app.innerHTML).not.toContain('data-action="print-tags"');
  });

  it("starts with no custom tag sets and hides editing controls until one is added", () => {
    const state = createInitialState();
    state.token = "token";
    state.competition = {
      id: "Example_2026",
      name: "Example competition",
    };
    state.wcif = {
      events: [],
      persons: [],
      extensions: [],
    } as unknown as WcifWithParticipation;
    state.view = "tags";
    const app = { innerHTML: "" } as HTMLElement;

    renderCustomTags(app, state);

    expect(state.customTags).toEqual([]);
    expect(app.innerHTML).toContain('id="add-custom-tags-form"');
    expect(app.innerHTML).not.toContain('id="custom-tags-form"');
  });

  it("uses the competition logo as the default for new custom tag sets", () => {
    expect(
      createInitialState().customTags,
    ).toEqual([]);
    expect(
      createInitialCustomTags(
        "Side event",
        "custom",
        "https://example.com/competition.png",
      ).competitionLogoUrl,
    ).toBe("https://example.com/competition.png");
  });
});
