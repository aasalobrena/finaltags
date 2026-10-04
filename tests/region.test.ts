import { describe, expect, it } from "vitest";
import type { ApiCountry } from "../src/types/api";
import type { RegionConfig } from "../src/types/wcif";
import { getRegion, getContinentId, isLocalCompetitor } from "../src/domain/region";

const countries: ApiCountry[] = [
  { iso2: "ES", continent_id: "_Europe" },
  { iso2: "US", continentId: "_North America" },
];

describe("region helpers", () => {
  it("defaults the local region to the competition country", () => {
    expect(getRegion(undefined, "ES")).toEqual({
      type: "country",
      id: "ES",
      prioritizeLocals: false,
    });
  });

  it("returns no continent for an unknown country", () => {
    expect(getContinentId(countries, "XX")).toBeUndefined();
  });

  it("supports both WCA continent property spellings", () => {
    expect(getContinentId(countries, "ES")).toBe("_Europe");
    expect(getContinentId(countries, "US")).toBe("_North America");
  });

  it("matches local competitors by country", () => {
    const region: RegionConfig = {
      type: "country",
      id: "ES",
      prioritizeLocals: true,
    };

    expect(isLocalCompetitor(countries, "ES", region)).toBe(true);
    expect(isLocalCompetitor(countries, "US", region)).toBe(false);
  });

  it("matches local competitors by continent", () => {
    const region: RegionConfig = {
      type: "continent",
      id: "_Europe",
      prioritizeLocals: true,
    };

    expect(isLocalCompetitor(countries, "ES", region)).toBe(true);
    expect(isLocalCompetitor(countries, "US", region)).toBe(false);
  });

  it("treats every competitor as local for a world region", () => {
    expect(
      isLocalCompetitor(countries, "US", {
        type: "world",
        id: "",
        prioritizeLocals: true,
      }),
    ).toBe(true);
  });
});
