import type { Competition, EventId } from "@wca/helpers";
import type { ApiCountry, PsychSheet } from "./api";
import type {
  CompetitionSummary,
  CustomTagsConfig,
  RegionConfig,
} from "./domain";

export type View = "list" | "config" | "print" | "tags";

export type AppState = {
  token: string | null;
  competitions: CompetitionSummary[];
  countries: ApiCountry[];
  psychSheets: Record<string, PsychSheet>;
  competition?: CompetitionSummary;
  canConfigureCompetition: boolean;
  wcif?: Competition;
  view: View;
  selectedEventIds: EventId[];
  customTags: CustomTagsConfig[];
  selectedCustomTagIndex: number;
  selectedCustomTagIndexes: number[];
  message?: string;
};

export type Route = {
  competitionId?: string;
  view: View;
};

export type RegionFormValue = RegionConfig & {
  type: Exclude<RegionConfig["type"], "world">;
};
