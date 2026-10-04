import type { EventId } from "../types/wcif";
import type { Competitor } from "../types/domain";
import { escapeHtml, flagUrl } from "../ui/html";
import { formatResult } from "../domain/results";

export const renderCardFace = ({
  competitor,
  eventId,
  title,
  logo,
  inverted,
}: {
  competitor: Competitor;
  eventId: EventId;
  title: string;
  logo: string;
  inverted: boolean;
}) => {
  const flag = flagUrl(competitor.country);
  const image = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(title)} logo">`
    : "";
  const country = flag
    ? `<img src="${escapeHtml(flag)}" alt="${escapeHtml(competitor.country)}">`
    : "";

  return `<div class="card-face${inverted ? " card-face--inverted" : ""}"><div class="face-name">${escapeHtml(competitor.name)}</div><div class="face-logo">${image}</div><div class="face-event"><span class="cubing-icon event-${eventId}"></span></div><div class="face-country">${country}</div><div class="face-seed">${competitor.seed || "-"}</div><div class="face-result">${escapeHtml(formatResult(eventId, competitor.result))}</div></div>`;
};

export const renderFoldCard = (
  competitor: Competitor,
  eventId: EventId,
  title: string,
  logo: string,
) =>
  `<article class="fold-card">${renderCardFace({ competitor, eventId, title, logo, inverted: true })}${renderCardFace({ competitor, eventId, title, logo, inverted: false })}</article>`;
