import type { EventId, WcifWithParticipation, RegionConfig } from "./wcif";
import type { ApiCountry, PsychSheetByEvent } from "./api";

export type CompetitionSummary = {
  id: string;
  name: string;
  cityName?: string;
  countryIso2?: string;
  startDate?: string;
};

export type Competitor = {
  name: string;
  country: string;
  seed: number;
  result: number;
  station: number;
  isLocal: boolean;
};

export type CompetitorDerivationInput = {
  wcif: WcifWithParticipation;
  eventId: EventId;
  countries: ApiCountry[];
  psychSheet?: PsychSheetByEvent[EventId];
  competitionCountryIso2?: string;
};

export type { RegionConfig };
