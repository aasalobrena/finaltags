import type { AppState, View } from "../types/app";
import { pathFor } from "../app/router";
import { escapeHtml } from "../ui/html";
import { renderShell } from "./shell";

export const renderCompetitionPage = (state: AppState, body: string) => {
  const competition = state.competition!;

  const renderTab = (view: View, label: string) => {
    const active = state.view === view;
    return `<a class="tab${active ? " tab--active" : ""}" href="${escapeHtml(pathFor(competition.id, view))}" data-link${active ? ' aria-current="page"' : ""}>${label}</a>`;
  };

  return renderShell(
    state,
    `<h1>${escapeHtml(competition.name)}</h1><nav class="tabs">${renderTab("print", "Print")}${state.canConfigureCompetition ? renderTab("config", "Settings") : ""}</nav>${body}`,
  );
};
