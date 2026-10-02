import type { ApiCountry } from "../types/api";
import type { RegionConfig, RegionType, Wcif } from "../types/wcif";
import { getFinaltagsData } from "./extension";

export const continentOptions = [
  { id: "_Africa", label: "Africa" },
  { id: "_Asia", label: "Asia" },
  { id: "_Europe", label: "Europe" },
  { id: "_North America", label: "North America" },
  { id: "_Oceania", label: "Oceania" },
  { id: "_South America", label: "South America" },
] as const;

export const getRegion = (
  wcif: Wcif | undefined,
  competitionCountryIso2 = "",
): RegionConfig =>
  getFinaltagsData(wcif)?.region ?? {
    type: "country",
    id: competitionCountryIso2,
    prioritizeLocals: false,
  };

export const getContinentId = (
  countries: ApiCountry[],
  country: string,
): string | undefined => {
  const match = countries.find((candidate) => candidate.iso2 === country);
  return match?.continent_id ?? match?.continentId;
};

export const isLocalCompetitor = (
  countries: ApiCountry[],
  country: string,
  region: RegionConfig,
): boolean =>
  region.type === "world" ||
  (region.type === "country" && country === region.id) ||
  (region.type === "continent" &&
    getContinentId(countries, country) === region.id);

export const toRegionSelectType = (
  region: RegionConfig,
): Exclude<RegionType, "world"> =>
  region.type === "world" ? "country" : region.type;
