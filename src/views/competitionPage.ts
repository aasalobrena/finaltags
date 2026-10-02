import type { AppState, View } from "../types";
import { pathFor } from "../app/router";
import { escapeHtml } from "../ui/html";
import { shell } from "../ui/shell";

export const competitionPage = (state: AppState, body: string) => {
  const competition = state.competition!;

  const tab = (view: View, label: string) => {
    const active = state.view === view;
    return `<a class="tab${active ? " tab--active" : ""}" href="${escapeHtml(pathFor(competition.id, view))}" data-link${active ? ' aria-current="page"' : ""}>${label}</a>`;
  };

  return shell(
    state,
    `<h1>${escapeHtml(competition.name)}</h1><nav class="tabs">${tab("print", "Print")}${tab("config", "Settings")}</nav>${body}`,
  );
};
