import type { AppState } from "../types/app";

export const createInitialCustomTags = (
  name = "",
  eventId = "custom",
  competitionLogoUrl = "",
): AppState["customTags"][number] => ({
  name,
  competitionLogoUrl,
  eventId,
  eventLogoUrl: "",
  competitors: [
    {
      personId: "custom",
      name: "",
      flag: "",
      flagUrl: "",
      seed: "",
      result: "",
    },
  ],
});

export const createInitialState = (): AppState => ({
  token: null,
  competitions: [],
  countries: [],
  psychSheets: {},
  canConfigureCompetition: false,
  view: "list",
  selectedEventIds: [],
  customTags: [],
  selectedCustomTagIndex: -1,
  selectedCustomTagIndexes: [],
});
