import type { AppState } from "../types/app";
import type { RegionConfig } from "../types/wcif";
import { escapeHtml } from "../ui/html";
import { continentOptions } from "../domain/region";

export const renderRegionOptions = (state: AppState, region: RegionConfig) =>
  region.type === "continent"
    ? continentOptions
        .map(
          (option) =>
            `<option value="${escapeHtml(option.id)}" ${region.id === option.id ? "selected" : ""}>${option.label}</option>`,
        )
        .join("")
    : state.countries
        .filter((country) => country.iso2)
        .map(
          (country) =>
            `<option value="${escapeHtml(country.iso2!)}" ${region.id === country.iso2 ? "selected" : ""}>${escapeHtml(country.name ?? country.iso2!)}</option>`,
        )
        .join("");
