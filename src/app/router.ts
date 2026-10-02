import type { Route, View } from "../types/app";

const BASE_URL = import.meta.env.BASE_URL;

export const readRoute = (): Route => {
  const pathname = window.location.pathname;

  const relativePath = pathname.startsWith(BASE_URL)
    ? pathname.slice(BASE_URL.length)
    : pathname.replace(/^\/+/, "");

  const [competitionId, section] = relativePath
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (!competitionId) {
    return { view: "list" };
  }

  return {
    competitionId,
    view: section === "configuration" ? "config" : "print",
  };
};

export const pathFor = (competitionId: string, view: View) =>
  `${BASE_URL}${encodeURIComponent(competitionId)}/${
    view === "config" ? "configuration" : "printing"
  }`;

export const navigate = (path: string) => {
  const fullPath = `${BASE_URL}${path.replace(/^\/+/, "")}`;

  if (fullPath !== window.location.pathname) {
    window.history.pushState({}, "", fullPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};
