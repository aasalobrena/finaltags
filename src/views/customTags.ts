import { getEventName } from "@wca/helpers";
import type { EventId } from "../types/wcif";
import type { AppState } from "../types/app";
import type {
  CustomTagCompetitor,
  CustomTagsConfig,
} from "../types/domain";
import { escapeHtml } from "../ui/html";
import { renderNotice } from "../components/shell";
import { renderCompetitionPage } from "../components/competitionTabs";

const eventIds: EventId[] = [
  "222",
  "333",
  "444",
  "555",
  "666",
  "777",
  "333bf",
  "333fm",
  "333oh",
  "clock",
  "minx",
  "pyram",
  "skewb",
  "sq1",
  "444bf",
  "555bf",
  "333mbf",
];

const getPerson = (state: AppState, personId: string) =>
  state.wcif?.persons.find(
    (person) => person.registrantId?.toString() === personId,
  );

const renderCompetitorFields = (
  competitor: CustomTagCompetitor,
  index: number,
  config: CustomTagsConfig,
  state: AppState,
) => {
  const people = (state.wcif?.persons ?? [])
    .filter(
      (person): person is typeof person & { registrantId: number } =>
        typeof person.registrantId === "number",
    )
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));
  const selectedPerson = getPerson(state, competitor.personId);
  const flag = competitor.flag;
  const personOptions = [
    `<option value="custom" ${competitor.personId === "custom" || !selectedPerson ? "selected" : ""}>Custom</option>`,
    ...people.map(
      (person) =>
        `<option value="${person.registrantId}" ${competitor.personId === String(person.registrantId) ? "selected" : ""}>${escapeHtml(person.name)}</option>`,
    ),
  ].join("");
  const countryOptions = [
    `<option value="" ${flag === "" ? "selected" : ""}>No flag</option>`,
    ...(state.countries ?? [])
      .filter(
        (country): country is typeof country & { iso2: string; name: string } =>
          Boolean(country.iso2 && country.name),
      )
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(
        (country) =>
          `<option value="${escapeHtml(country.iso2)}" ${flag === country.iso2 ? "selected" : ""}>${escapeHtml(country.name)}</option>`,
      ),
    `<option value="custom" ${flag === "custom" ? "selected" : ""}>Custom</option>`,
  ].join("");
  const customCompetitor = competitor.personId === "custom" || !selectedPerson;
  const customFlag = flag === "custom";

  return `<fieldset class="custom-tag-competitor"><legend>Competitor ${index + 1}</legend><label class="field"><span>Competitor</span><select name="personId">${personOptions}</select></label>${customCompetitor ? `<label class="field"><span>Name</span><input name="name" value="${escapeHtml(competitor.name)}" autocomplete="off"></label>` : `<div class="field"><span>Name</span><output>${escapeHtml(selectedPerson.name)}</output></div>`}<label class="field"><span>Flag</span><select name="flag">${countryOptions}</select></label>${customFlag ? `<label class="field"><span>Custom flag URL</span><input name="flagUrl" type="url" value="${escapeHtml(competitor.flagUrl)}" placeholder="https://…/flag.png" required></label>` : ""}<label class="field"><span>Seed</span><input name="seed" value="${escapeHtml(competitor.seed)}" inputmode="numeric"></label><label class="field"><span>Seed result</span><input name="result" value="${escapeHtml(competitor.result)}" placeholder="e.g. 12.34"></label><button class="link-button custom-tag-remove" type="button" data-action="remove-custom-tag" data-index="${index}" ${config.competitors.length === 1 ? "disabled" : ""}>Remove competitor</button></fieldset>`;
};

export const readCustomTagsForm = (
  form: HTMLFormElement,
  state: AppState,
): CustomTagsConfig => {
  const formData = new FormData(form);
  const competitors = Array.from(
    form.querySelectorAll<HTMLElement>(".custom-tag-competitor"),
  ).map((fieldset) => {
    const value = (name: string) =>
      fieldset.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)?.value
        .trim() ?? "";
    const personId = value("personId") || "custom";
    const person = getPerson(state, personId);

    return {
      personId: person ? personId : "custom",
      name: person?.name ?? value("name"),
      flag: value("flag"),
      flagUrl: value("flag") === "custom" ? value("flagUrl") : "",
      seed: value("seed"),
      result: value("result"),
    };
  });

  return {
    name: formData.get("configName")?.toString().trim() ?? "",
    competitionLogoUrl:
      formData.get("competitionLogoUrl")?.toString().trim() ?? "",
    eventId: formData.get("eventId")?.toString() ?? "custom",
    eventLogoUrl:
      formData.get("eventId") === "custom"
        ? formData.get("eventLogoUrl")?.toString().trim() ?? ""
        : "",
    competitors,
  };
};

export const renderCustomTags = (app: HTMLElement, state: AppState) => {
  const nameCounts = new Map<string, number>();
  for (const item of state.customTags) {
    nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
  }
  const eventOccurrences = new Map<string, number>();
  const configOptions = state.customTags
    .map((item, index) => {
      const occurrence = (eventOccurrences.get(item.name) ?? 0) + 1;
      eventOccurrences.set(item.name, occurrence);
      const suffix =
        (nameCounts.get(item.name) ?? 0) > 1 ? ` (${occurrence})` : "";
      return `<option value="${index}" ${index === state.selectedCustomTagIndex ? "selected" : ""}>${escapeHtml(item.name || "Unnamed event tags")}${suffix}</option>`;
    }    )
    .join("");
  const config = state.customTags[state.selectedCustomTagIndex];
  const eventOptions = config
    ? [
        `<option value="custom" ${config.eventId === "custom" ? "selected" : ""}>Custom</option>`,
        ...eventIds.map(
          (eventId) =>
            `<option value="${eventId}" ${config.eventId === eventId ? "selected" : ""}>${escapeHtml(getEventName(eventId))}</option>`,
        ),
      ].join("")
    : "";
  const competitors = config
    ? config.competitors
        .map((competitor, index) =>
          renderCompetitorFields(competitor, index, config, state),
        )
        .join("")
    : "";
  const addForm = `<form id="add-custom-tags-form" class="custom-tags-event-controls custom-tags-add-controls"><label class="field"><span>Name for these tags</span><input name="newConfigName" required placeholder="e.g. 3x3 final"></label><label class="field"><span>Event</span><select name="newEventId"><option value="custom">Custom event</option>${eventIds.map((eventId) => `<option value="${eventId}">${escapeHtml(getEventName(eventId))}</option>`).join("")}</select></label><button class="button button--secondary" type="button" data-action="add-custom-event">Add event tags</button></form>`;
  const selectConfig = state.customTags.length
    ? `<div class="custom-tags-event-controls"><label class="field"><span>Saved tag sets</span><select id="custom-tags-config"><option value="-1" ${config ? "" : "selected"}>Select a tag set</option>${configOptions}</select></label><button class="button button--secondary" type="button" data-action="remove-custom-event" ${config ? "" : "disabled"}>Remove selected set</button></div>`
    : "";
  const configEditor = config
    ? `<form id="custom-tags-form"><div class="custom-tags-global"><label class="field"><span>Name</span><input name="configName" value="${escapeHtml(config.name)}" required></label><label class="field"><span>Competition logo URL (optional)</span><input name="competitionLogoUrl" type="url" value="${escapeHtml(config.competitionLogoUrl)}" placeholder="https://…/logo.png"></label><label class="field"><span>Event</span><select name="eventId">${eventOptions}</select></label>${config.eventId === "custom" ? `<label class="field"><span>Custom event logo URL</span><input name="eventLogoUrl" type="url" value="${escapeHtml(config.eventLogoUrl)}" placeholder="https://…/event.png" required></label>` : ""}</div><div class="custom-tags-competitors">${competitors}</div><div class="custom-tags-actions"><button class="button button--secondary" type="button" data-action="add-custom-tag">Add competitor</button>${state.canConfigureCompetition ? `<button class="button button--secondary" type="button" data-action="save-custom-tags">Save to competition</button>` : ""}</div><p class="custom-tags-save-hint">${state.canConfigureCompetition ? "Custom tag data is saved in this competition's WCIF extension." : "Saving custom tag data to WCIF requires competition management access."}</p>${renderNotice(state.message, state.message === "Saved")}</form>`
    : "";
  const editor = `<section class="custom-tags-editor"><div class="custom-tags-intro"><h2>Custom tags</h2><p>Create and manage named tag sets for each event. To select and print tags, use the Printing tab.</p></div>${addForm}${selectConfig}${configEditor}</section>`;

  app.innerHTML = renderCompetitionPage(state, editor);
};
