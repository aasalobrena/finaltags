import type { EventId } from "../types/wcif";
import type {
  Competitor,
  CustomTagCompetitor,
  CustomTagsConfig,
} from "../types/domain";
import { escapeHtml, flagUrl } from "../ui/html";
import { formatResult } from "../domain/results";

export const renderTagFace = ({
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

  return `<div class="tag-face${inverted ? " tag-face--inverted" : ""}"><div class="tag-name">${escapeHtml(competitor.name)}</div><div class="tag-logo">${image}</div><div class="tag-event"><span class="cubing-icon event-${eventId}"></span></div><div class="tag-country">${country}</div><div class="tag-seed">${competitor.seed || "-"}</div><div class="tag-result">${escapeHtml(formatResult(eventId, competitor.result))}</div></div>`;
};

export const renderFoldTag = (
  competitor: Competitor,
  eventId: EventId,
  title: string,
  logo: string,
) =>
  `<article class="fold-tag">${renderTagFace({ competitor, eventId, title, logo, inverted: true })}${renderTagFace({ competitor, eventId, title, logo, inverted: false })}</article>`;

const renderCustomTagFace = (
  competitor: CustomTagCompetitor,
  config: CustomTagsConfig,
  inverted: boolean,
) => {
  const flag =
    competitor.flag === "custom"
      ? competitor.flagUrl.trim()
      : flagUrl(competitor.flag);
  const flagImage = flag
    ? `<img src="${escapeHtml(flag)}" alt="${escapeHtml(competitor.flag)}">`
    : "";
  const competitionLogo = config.competitionLogoUrl.trim()
    ? `<img src="${escapeHtml(config.competitionLogoUrl)}" alt="Competition logo">`
    : "";
  const eventLogo = config.eventLogoUrl.trim()
    ? `<img src="${escapeHtml(config.eventLogoUrl)}" alt="Custom event logo">`
    : "";
  const event =
    config.eventId === "custom"
      ? eventLogo
      : `<span class="cubing-icon event-${escapeHtml(config.eventId)}"></span>`;

  return `<div class="tag-face${inverted ? " tag-face--inverted" : ""}"><div class="tag-name">${escapeHtml(competitor.name)}</div><div class="tag-logo tag-logo--custom">${competitionLogo}</div><div class="tag-event tag-event--custom">${event}</div><div class="tag-country">${flagImage}</div><div class="tag-seed">${escapeHtml(competitor.seed) || "-"}</div><div class="tag-result">${escapeHtml(competitor.result) || "-"}</div></div>`;
};

export const renderCustomFoldTag = (
  competitor: CustomTagCompetitor,
  config: CustomTagsConfig,
) =>
  `<article class="fold-tag">${renderCustomTagFace(competitor, config, true)}${renderCustomTagFace(competitor, config, false)}</article>`;
