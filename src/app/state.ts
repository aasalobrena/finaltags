import type { AppState } from "../types/app";

export const createInitialState = (): AppState => ({
  token: null,
  competitions: [],
  countries: [],
  psychSheets: {},
  view: "list",
  selectedEventIds: [],
});
