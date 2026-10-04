import { FLAG_CDN_BASE } from "../config";

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

export const flagUrl = (country: string) =>
  country ? `${FLAG_CDN_BASE}/${country.toLowerCase()}.png` : "";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const countryName = (iso2?: string) => {
  if (!iso2) return "";

  try {
    return regionNames.of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
};

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export const formatDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
};
