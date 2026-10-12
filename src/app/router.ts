import type { Route, View } from "../types/app";

const BASE_URL = import.meta.env.BASE_URL;

const relativePath = (pathname: string, baseUrl: string) => {
  const basePath = baseUrl.replace(/\/+$/, "");
  if (pathname === basePath) {
    return "";
  }

  const basePathPrefix = `${basePath}/`;
  return pathname.startsWith(basePathPrefix)
    ? pathname.slice(basePathPrefix.length)
    : pathname.replace(/^\/+/, "");
};

export const readRoute = (
  pathname = window.location.pathname,
  baseUrl = BASE_URL,
): Route => {
  const parts = relativePath(pathname, baseUrl)
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (parts.length === 1 && parts[0] === "custom") {
    return { view: "list" };
  }

  const [competitionId, section] = parts;

  if (!competitionId) {
    return { view: "list" };
  }

  return {
    competitionId,
    view:
      section === "configuration"
        ? "config"
        : section === "tags" || section === "custom"
          ? "tags"
          : "print",
  };
};

export const pathFor = (
  competitionId: string,
  view: View,
  baseUrl = BASE_URL,
) =>
  `${baseUrl}${encodeURIComponent(competitionId)}/${
    view === "config"
      ? "configuration"
      : view === "tags"
        ? "custom"
        : "printing"
  }`;

export const navigationPath = (path: string, baseUrl = BASE_URL) =>
  `${baseUrl}${relativePath(path, baseUrl)}`;

export const navigate = (path: string) => {
  const fullPath = navigationPath(path);

  if (fullPath !== window.location.pathname) {
    window.history.pushState({}, "", fullPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};
