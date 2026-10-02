import { getEventName } from "@wca/helpers";
import type { AppState } from "../types/app";
import { deriveCompetitors } from "../domain/competitors";
import { getFinaltagsData, getLogo } from "../domain/extension";
import { getPaperSize, applyPageSize, paperSizes } from "../domain/paper";
import { escapeHtml } from "../ui/html";
import { renderNotice } from "../components/shell";
import { renderCompetitionPage } from "../components/competitionTabs";
import { renderFoldCard } from "../components/printCard";

const renderPrintPages = (state: AppState, paper: keyof typeof paperSizes) => {
  const wcif = state.wcif!;
  const logo = getLogo(wcif);
  const cards = state.selectedEventIds.flatMap((eventId) =>
    deriveCompetitors({
      wcif,
      eventId,
      countries: state.countries,
      psychSheet: state.psychSheets[eventId],
      competitionCountryIso2: state.competition?.countryIso2,
    }).map((competitor) => ({ eventId, competitor })),
  );

  return Array.from(
    { length: Math.ceil(cards.length / 2) },
    (_, pageIndex) =>
      `<section class="print-page print-page--${paper}">${cards
        .slice(pageIndex * 2, pageIndex * 2 + 2)
        .map(({ eventId, competitor }) =>
          renderFoldCard(competitor, eventId, state.competition!.name, logo),
        )
        .join("")}</section>`,
  ).join("");
};

export const renderPrinting = (app: HTMLElement, state: AppState) => {
  const wcif = state.wcif!;
  const paper = getPaperSize(getFinaltagsData(wcif)?.paperSize);
  applyPageSize(paper);

  const eventOptions = wcif.events
    .map(
      (event) =>
        `<label class="event-option"><input type="checkbox" name="event" value="${escapeHtml(event.id)}" ${state.selectedEventIds.includes(event.id) ? "checked" : ""}><span class="cubing-icon event-${event.id}"></span><span class="event-name">${escapeHtml(getEventName(event.id))}</span></label>`,
    )
    .join("");

  app.innerHTML = renderCompetitionPage(
    state,
    `<div class="toolbar"><p>Choose the events. Each ${paperSizes[paper].label} sheet holds two cards.</p><button class="button" data-action="download-pdf" ${state.selectedEventIds.length ? "" : "disabled"}>Print PDF</button></div>${renderNotice(state.message)}<div class="event-options">${eventOptions}</div><section class="print-pages print-preview">${renderPrintPages(state, paper)}</section>`,
  );
};
