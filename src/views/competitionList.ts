import type { AppState } from "../types/app";
import { pathFor } from "../app/router";
import { countryName, escapeHtml, formatDate } from "../ui/html";
import { renderNotice, renderShell } from "../components/shell";

export const renderCompetitionList = (app: HTMLElement, state: AppState) => {
  const rows = state.competitions
    .map((competition) => {
      const place = [competition.cityName, countryName(competition.countryIso2)]
        .filter(Boolean)
        .join(", ");
      const date = formatDate(competition.startDate);

      return `<a class="competition" href="${escapeHtml(pathFor(competition.id, "print"))}" data-link><span class="competition__info"><strong>${escapeHtml(competition.name)}</strong>${place ? `<span>${escapeHtml(place)}</span>` : ""}</span>${date ? `<time>${escapeHtml(date)}</time>` : ""}</a>`;
    })
    .join("");

  app.innerHTML = renderShell(
    state,
    `<div class="list-head"><h1>Your competitions (${state.competitions.length})</h1></div>${renderNotice(state.message)}<div class="competition-list">${rows || `<p class="empty">We couldn't find any competitions you manage.</p>`}</div>`,
  );
};
