import type { Route, View } from "../types/app";

export const readRoute = (): Route => {
  const [competitionId, section] = window.location.pathname
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
  `/${encodeURIComponent(competitionId)}/${view === "config" ? "configuration" : "printing"}`;

export const navigate = (path: string) => {
  if (path !== window.location.pathname) {
    window.history.pushState({}, "", path);
  }
};
