import type { AppState } from "../types/app";
import { getFinaltagsData } from "../domain/extension";
import { getRegion } from "../domain/region";
import { getPaperSize, paperSizes } from "../domain/paper";
import { escapeHtml } from "../ui/html";
import { renderNotice } from "../components/shell";
import { renderCompetitionPage } from "../components/competitionTabs";
import { renderRegionOptions } from "../components/regionOptions";
export const renderConfiguration = (app: HTMLElement, state: AppState) => {
  const wcif = state.wcif!;
  const data = getFinaltagsData(wcif);
  const logo = data?.logoUrl ?? "";
  const region = getRegion(wcif, state.competition?.countryIso2 ?? "");
  const regionType = region.type === "world" ? "country" : region.type;
  const regionId =
    region.type === "world"
      ? (state.competition?.countryIso2 ?? "")
      : region.id;
  const localEnabled = region.prioritizeLocals;
  const paper = getPaperSize(data?.paperSize);
  const saved = state.message === "Saved";
  const paperOptions = (
    Object.keys(paperSizes) as Array<keyof typeof paperSizes>
  )
    .map(
      (id) =>
        `<option value="${id}" ${id === paper ? "selected" : ""}>${paperSizes[id].detail}</option>`,
    )
    .join("");
  const regionControls = `<div id="region-controls" class="region-controls" ${localEnabled ? "" : "hidden"}><span class="label">Who counts as local?</span><div class="region-row"><select id="region-type" name="regionType" aria-label="Region type"><option value="continent" ${regionType === "continent" ? "selected" : ""}>Continent</option><option value="country" ${regionType === "country" ? "selected" : ""}>Country</option></select><select id="region-id" name="regionId" aria-label="Region">${renderRegionOptions(state, { type: regionType, id: regionId, prioritizeLocals: true })}</select></div></div>`;

  app.innerHTML = renderCompetitionPage(
    state,
    `<form id="competition-settings-form" class="form"><label class="field"><span>Logo (optional)</span><input id="logo-url" name="logoUrl" type="url" value="${escapeHtml(logo)}" placeholder="https://…/logo.png"></label><label class="field"><span>Paper size</span><select id="paper-size" name="paperSize">${paperOptions}</select></label><label class="check"><input id="prioritize-locals" type="checkbox" name="prioritizeLocals" ${localEnabled ? "checked" : ""}><span>Prioritize locals</span></label>${regionControls}<div class="form-actions"><button class="button" type="submit">Save</button>${renderNotice(state.message, saved)}</div></form>`,
  );
};
