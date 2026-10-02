import type { Competition as Wcif, EventId, Result, Round } from "@wca/helpers";

export type ParticipationSource =
  | { type: "registrations" }
  | { type: "round"; roundId: string }
  | { type: "linkedRounds"; roundIds: string[] };

export type RoundWithParticipation = Round & {
  participationRuleset?: {
    participationSource?: ParticipationSource;
  };
};

export type WcifWithParticipation = Omit<Wcif, "events"> & {
  events: Array<
    Omit<Wcif["events"][number], "rounds"> & {
      rounds: RoundWithParticipation[];
    }
  >;
};

export type RegionType = "world" | "continent" | "country";

export type RegionConfig = {
  type: RegionType;
  id: string;
  prioritizeLocals: boolean;
};

export type PaperSize = "a4" | "letter";

export type FinaltagsExtensionData = {
  logoUrl?: string;
  region?: RegionConfig;
  paperSize?: PaperSize;
};

export type CompetitionSummary = {
  id: string;
  name: string;
  cityName?: string;
  countryIso2?: string;
  startDate?: string;
};

export type ApiCompetition = {
  id: string;
  name: string;
  city_name?: string;
  country_iso2?: string;
  start_date?: string;
};

export type ApiCountry = {
  name?: string;
  iso2?: string;
  continent_id?: string;
  continentId?: string;
};

export type PsychRanking = {
  name: string;
  wca_id?: string;
  country_iso2?: string;
  pos?: number;
  single_best?: number;
  average_best?: number;
};

export type PsychSheet = {
  sorted_rankings: PsychRanking[];
};

export type Competitor = {
  name: string;
  country: string;
  seed: number;
  result: number;
  station: number;
  isLocal: boolean;
};

export type View = "list" | "config" | "print";

export type AppState = {
  token: string | null;
  competitions: CompetitionSummary[];
  countries: ApiCountry[];
  psychSheets: Record<string, PsychSheet>;
  competition?: CompetitionSummary;
  wcif?: WcifWithParticipation;
  view: View;
  selectedEventIds: EventId[];
  message?: string;
};

export type Route = {
  competitionId?: string;
  view: View;
};

export type { EventId, Result, Round, Wcif };
