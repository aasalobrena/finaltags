import type { EventId } from "./wcif";

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

export type PsychSheetByEvent = Record<EventId, PsychSheet | undefined>;
