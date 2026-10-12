import { getEventName } from "@wca/helpers";
import type { AppState } from "../types/app";
import { deriveCompetitors } from "../domain/competitors";
import { getFinaltagsData, getLogo } from "../domain/extension";
import { getPaperSize, applyPageSize, paperSizes } from "../domain/paper";
import { escapeHtml } from "../ui/html";
import { renderNotice } from "../components/shell";
import { renderCompetitionPage } from "../components/competitionTabs";
import { renderCustomFoldTag, renderFoldTag } from "../components/printTag";

const renderPrintPages = (state: AppState, paper: keyof typeof paperSizes) => {
  const wcif = state.wcif!;
  const logo = getLogo(wcif);
  const officialTags = state.selectedEventIds.flatMap((eventId) =>
    deriveCompetitors({
      wcif,
      eventId,
      countries: state.countries,
      psychSheet: state.psychSheets[eventId],
      competitionCountryIso2: state.competition?.countryIso2,
    }).map((competitor) => ({ eventId, competitor })),
  );
  const customTags = state.selectedCustomTagIndexes.flatMap((index) => {
    const config = state.customTags[index];
    return config
      ? config.competitors
          .filter((competitor) => competitor.name.trim())
          .map((competitor) => ({ competitor, config }))
      : [];
  });
  const tags = [
    ...officialTags.map(({ eventId, competitor }) =>
      renderFoldTag(competitor, eventId, state.competition!.name, logo),
    ),
    ...customTags.map(({ competitor, config }) =>
      renderCustomFoldTag(competitor, config),
    ),
  ];

  return Array.from(
    { length: Math.ceil(tags.length / 2) },
    (_, pageIndex) =>
      `<section class="print-page print-page--${paper}">${tags
        .slice(pageIndex * 2, pageIndex * 2 + 2)
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
  const customTagOptions = state.customTags
    .map(
      (config, index) =>
        config.competitors.some((competitor) => competitor.name.trim())
          ? `<label class="event-option"><input type="checkbox" name="customTag" value="${index}" ${state.selectedCustomTagIndexes.includes(index) ? "checked" : ""}>${config.eventId === "custom" ? config.eventLogoUrl ? `<img class="event-option__custom-logo" src="${escapeHtml(config.eventLogoUrl)}" alt="">` : '<span class="event-option__custom-icon" aria-hidden="true">C</span>' : `<span class="cubing-icon event-${escapeHtml(config.eventId)}"></span>`}<span class="event-name">${escapeHtml(config.name)}</span></label>`
          : "",
    )
    .filter(Boolean)
    .join("");
  const canPrint =
    state.selectedEventIds.length > 0 ||
    state.selectedCustomTagIndexes.some((index) =>
      state.customTags[index]?.competitors.some((competitor) =>
        competitor.name.trim(),
      ),
    );

  app.innerHTML = renderCompetitionPage(
    state,
    `<div class="toolbar"><p>Choose official events and custom tag sets to print. Each ${paperSizes[paper].label} sheet holds two tags.</p><button class="button" data-action="print-tags" ${canPrint ? "" : "disabled"}>Print tags</button></div>${renderNotice(state.message)}<h2>Official events</h2><div class="event-options">${eventOptions}</div>${customTagOptions ? `<h2>Custom tag sets</h2><div class="event-options">${customTagOptions}</div>` : ""}<section class="print-pages print-preview">${renderPrintPages(state, paper)}</section>`,
  );
};
