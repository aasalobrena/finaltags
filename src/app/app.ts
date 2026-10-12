import { getEventName } from "@wca/helpers";
import type { EventId, RegionType } from "../types/wcif";
import {
  fetchCompetitionWcif,
  fetchManagedCompetitions,
  fetchPublicCompetitionWcif,
  fetchPsychSheet,
  patchCompetitionExtensions,
} from "../api/competitionApi";
import { getTokenFromHash, logout, startWcaLogin } from "../api/auth";
import { WcaApiError, WcaClient } from "../api/wcaClient";
import {
  buildCompetitionExtensions,
  getFinaltagsData,
  getLogo,
} from "../domain/extension";
import { getRegion } from "../domain/region";
import { getPaperSize } from "../domain/paper";
import { renderRegionOptions } from "../components/regionOptions";
import { getRegionFromForm } from "../ui/forms";
import { renderConfiguration } from "../views/configuration";
import {
  readCustomTagsForm,
  renderCustomTags,
} from "../views/customTags";
import { createInitialCustomTags, createInitialState } from "./state";
import { navigate, pathFor, readRoute } from "./router";
import { renderApp, renderLoading } from "./render";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isPrimaryNavigationClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

export const createApp = (app: HTMLElement) => {
  const state = createInitialState();
  const client = new WcaClient();
  const publicClient = new WcaClient();

  const render = () => renderApp(app, state);
  const getSelectedCustomTags = () => {
    const config = state.customTags[state.selectedCustomTagIndex];
    if (!config) {
      throw new Error("No custom event tag configuration is selected.");
    }
    return config;
  };
  const updateSelectedCustomTagsFromForm = (form: HTMLFormElement) => {
    state.customTags[state.selectedCustomTagIndex] = readCustomTagsForm(
      form,
      state,
    );
  };
  const isValidTagConfig = (config: (typeof state.customTags)[number]) => {
    const urls = [
      ...(config.eventId === "custom" ? [config.eventLogoUrl] : []),
      ...config.competitors
        .filter((competitor) => competitor.flag === "custom")
        .map((competitor) => competitor.flagUrl),
    ];
    return urls.every((url) => {
      const input = document.createElement("input");
      input.type = "url";
      input.required = true;
      input.value = url;
      return input.checkValidity();
    });
  };

  const handleUnauthorized = (error: unknown, shouldLogout = true) => {
    if (
      !shouldLogout ||
      !(error instanceof WcaApiError) ||
      error.status !== 401
    ) {
      return false;
    }

    logout();
    client.setToken(null);
    Object.assign(state, createInitialState());
    state.message = "Your WCA session has expired. Please sign in again.";
    navigate("/");
    render();
    return true;
  };

  const loadManagedCompetitions = async () => {
    const result = await fetchManagedCompetitions(client);
    state.competitions = result.competitions;
    state.countries = result.countries;
    state.message = undefined;
  };

  const loadCompetition = async (competitionId: string) => {
    const competition = state.competitions.find(
      (candidate) => candidate.id === competitionId,
    );

    renderLoading(app, state);
    const wcif = competition
      ? await fetchCompetitionWcif(client, competition.id)
      : await fetchPublicCompetitionWcif(publicClient, competitionId);

    if (!wcif.formatVersion?.startsWith("2.")) {
      throw new Error(
        `WCA did not return WCIF v2 (received: ${wcif.formatVersion ?? "unknown"}).`,
      );
    }

    state.competition = competition ?? {
      id: wcif.id,
      name: wcif.name,
      startDate: wcif.schedule?.startDate,
    };
    state.canConfigureCompetition = Boolean(competition);
    state.wcif = wcif;
    state.psychSheets = {};
    state.selectedEventIds = [];
    state.selectedCustomTagIndexes = [];
    const data = getFinaltagsData(wcif);
    state.customTags = data?.customTags?.length
      ? data.customTags.map((config) => {
          const eventId = wcif.events.find(
            (event) => event.id === config.eventId,
          )?.id;
          return {
            name:
              config.name?.trim() ||
              (eventId ? getEventName(eventId) : "Custom event"),
            competitionLogoUrl: config.competitionLogoUrl ?? "",
            eventId: config.eventId ?? "333",
            eventLogoUrl: config.eventLogoUrl ?? "",
            competitors: config.competitors.length
              ? config.competitors.map((competitor) => {
                  const person =
                    competitor.personId === "custom"
                      ? undefined
                      : wcif.persons.find(
                          (candidate) =>
                            candidate.registrantId?.toString() ===
                            competitor.personId,
                        );
                  return {
                    personId: person?.registrantId?.toString() ?? "custom",
                    name: person?.name ?? competitor.name ?? "",
                    flag: competitor.flag ?? person?.countryIso2 ?? "",
                    flagUrl: competitor.flagUrl ?? "",
                    seed: competitor.seed ?? "",
                    result: competitor.result ?? "",
                  };
                })
              : [],
          };
        })
      : [];
    state.selectedCustomTagIndex = -1;
  };

  const openRoute = async () => {
    const route = readRoute();
    state.message = undefined;
    let loadingManagedCompetitions = false;

    if (!state.token) {
      render();
      return;
    }

    try {
      if (state.competitions.length === 0) {
        renderLoading(app, state);
        loadingManagedCompetitions = true;
        await loadManagedCompetitions();
        loadingManagedCompetitions = false;
      }

      if (!route.competitionId) {
        state.competition = undefined;
        state.canConfigureCompetition = false;
        state.wcif = undefined;
        state.view = route.view;
        render();
        return;
      }

      if (state.competition?.id !== route.competitionId) {
        await loadCompetition(route.competitionId);
      }

      const view =
        route.view === "config" && !state.canConfigureCompetition
          ? "print"
          : route.view;
      state.view = view;
      render();

      const path = pathFor(route.competitionId, view);
      if (window.location.pathname !== path) {
        window.history.replaceState({}, "", path);
      }
    } catch (error) {
      if (
        handleUnauthorized(
          error,
          loadingManagedCompetitions ||
            !route.competitionId ||
            state.competitions.some(
              (candidate) => candidate.id === route.competitionId,
            ),
        )
      ) {
        return;
      }

      state.competition = undefined;
      state.canConfigureCompetition = false;
      state.wcif = undefined;
      state.view = "list";
      state.message = getErrorMessage(error, "Couldn't load that page.");
      render();
    }
  };

  const handleNavigation = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>("a[data-link]");

    if (!link || !isPrimaryNavigationClick(event)) {
      return false;
    }

    event.preventDefault();
    navigate(link.pathname);
    await openRoute();
    return true;
  };

  const handleAction = async (action: string, actionElement: HTMLElement) => {
    switch (action) {
      case "login": {
        const configurationError = startWcaLogin();
        if (configurationError) {
          state.message = configurationError;
          render();
        }
        return;
      }
      case "logout":
        logout();
        navigate("/");
        Object.assign(state, createInitialState());
        client.setToken(null);
        render();
        return;
      case "print-tags": {
        if (!state.competition || state.view !== "print") return;
        const selectedCustomTags = state.selectedCustomTagIndexes.map(
          (index) => state.customTags[index],
        );
        const invalidConfig = selectedCustomTags.find(
          (config) => config && !isValidTagConfig(config),
        );
        if (invalidConfig) {
          state.message = "Check the custom event and flag URLs before printing.";
          render();
          return;
        }
        const hasTags =
          state.selectedEventIds.length > 0 ||
          selectedCustomTags.some((config) =>
            config?.competitors.some((competitor) =>
              competitor.name.trim(),
            ),
          );
        if (!hasTags) return;

        const previousTitle = document.title;
        document.title = `finaltags_${state.competition.id}`;
        window.addEventListener(
          "afterprint",
          () => {
            document.title = previousTitle;
          },
          { once: true },
        );
        window.print();
        return;
      }
      case "add-custom-event": {
        const form = app.querySelector<HTMLFormElement>(
          "#add-custom-tags-form",
        );
        const nameInput =
          form?.querySelector<HTMLInputElement>('[name="newConfigName"]');
        const eventSelect =
          form?.querySelector<HTMLSelectElement>('[name="newEventId"]');
        if (!form || !nameInput?.reportValidity() || !eventSelect) return;
        const currentForm =
          app.querySelector<HTMLFormElement>("#custom-tags-form");
        if (currentForm) updateSelectedCustomTagsFromForm(currentForm);
        const config = createInitialCustomTags(
          nameInput.value.trim(),
          eventSelect.value,
          getLogo(state.wcif),
        );
        state.customTags.push(config);
        state.selectedCustomTagIndex = state.customTags.length - 1;
        state.message = undefined;
        render();
        return;
      }
      case "remove-custom-event": {
        const form = app.querySelector<HTMLFormElement>("#custom-tags-form");
        if (
          !form ||
          state.selectedCustomTagIndex < 0 ||
          state.selectedCustomTagIndex >= state.customTags.length
        ) {
          return;
        }
        updateSelectedCustomTagsFromForm(form);
        const removedIndex = state.selectedCustomTagIndex;
        state.customTags.splice(state.selectedCustomTagIndex, 1);
        state.selectedCustomTagIndexes = state.selectedCustomTagIndexes
          .filter((index) => index !== removedIndex)
          .map((index) => (index > removedIndex ? index - 1 : index));
        state.selectedCustomTagIndex = -1;
        state.message = undefined;
        render();
        return;
      }
      case "add-custom-tag": {
        const form = app.querySelector<HTMLFormElement>("#custom-tags-form");
        if (!form) return;
        updateSelectedCustomTagsFromForm(form);
        getSelectedCustomTags().competitors.push({
          personId: "custom",
          name: "",
          flag: "",
          flagUrl: "",
          seed: "",
          result: "",
        });
        state.message = undefined;
        render();
        return;
      }
      case "remove-custom-tag": {
        const form = app.querySelector<HTMLFormElement>("#custom-tags-form");
        if (!form) return;
        updateSelectedCustomTagsFromForm(form);
        const config = getSelectedCustomTags();
        const index = Number(actionElement.dataset.index);
        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index < config.competitors.length &&
          config.competitors.length > 1
        ) {
          config.competitors.splice(index, 1);
        }
        state.message = undefined;
        render();
        return;
      }
      case "save-custom-tags": {
        if (!state.canConfigureCompetition || !state.wcif || !state.competition) {
          return;
        }
        const form = app.querySelector<HTMLFormElement>("#custom-tags-form");
        if (!form || !form.reportValidity()) return;
        updateSelectedCustomTagsFromForm(form);
        const invalidConfigIndex = state.customTags.findIndex(
          (config) => !isValidTagConfig(config),
        );
        if (invalidConfigIndex >= 0) {
          state.selectedCustomTagIndex = invalidConfigIndex;
          render();
          app
            .querySelector<HTMLFormElement>("#custom-tags-form")
            ?.reportValidity();
          return;
        }
        const currentData = getFinaltagsData(state.wcif);
        const region = getRegion(
          state.wcif,
          state.competition.countryIso2 ?? "",
        );
        const wcif = {
          ...state.wcif,
          extensions: buildCompetitionExtensions(state.wcif, {
            logoUrl: currentData?.logoUrl ?? "",
            region,
            paperSize: getPaperSize(currentData?.paperSize),
            customTags: state.customTags,
          }),
        };
        if (!wcif.formatVersion) {
          throw new Error("The WCIF has no formatVersion.");
        }
        await patchCompetitionExtensions(client, state.competition.id, wcif);
        state.wcif = wcif;
        state.message = "Saved";
        render();
        return;
      }
      default:
        return;
    }
  };

  const handleClick = async (event: MouseEvent) => {
    try {
      if (await handleNavigation(event)) {
        return;
      }

      const target = event.target as HTMLElement;
      const actionElement = target.closest<HTMLElement>("[data-action]");
      const action = actionElement?.dataset.action;
      if (!action || !actionElement) return;

      await handleAction(action, actionElement);
    } catch (error) {
      if (handleUnauthorized(error)) return;

      state.message = getErrorMessage(
        error,
        "Something went wrong. Please try again.",
      );
      render();
    }
  };

  const handleEventChange = async (target: HTMLInputElement) => {
    if (target.name === "customTag") {
      const index = Number(target.value);
      if (target.checked && Number.isInteger(index)) {
        if (!state.selectedCustomTagIndexes.includes(index)) {
          state.selectedCustomTagIndexes.push(index);
        }
      } else {
        state.selectedCustomTagIndexes =
          state.selectedCustomTagIndexes.filter(
            (selectedIndex) => selectedIndex !== index,
          );
      }
      state.message = undefined;
      render();
      return;
    }

    if (target.id === "prioritize-locals") {
      const controls = app.querySelector<HTMLElement>("#region-controls");
      if (controls) controls.hidden = !target.checked;
      return;
    }

    if (target.id === "region-type") {
      const regionSelect = app.querySelector<HTMLSelectElement>("#region-id");
      if (!regionSelect) return;

      const currentRegion = getRegion(
        state.wcif,
        state.competition?.countryIso2 ?? "",
      );
      const type = target.value as RegionType;
      const currentId = type === currentRegion.type ? currentRegion.id : "";
      regionSelect.innerHTML = renderRegionOptions(state, {
        type,
        id: currentId,
        prioritizeLocals: true,
      });
      return;
    }

    if (target.name !== "event") return;

    state.message = undefined;
    const eventId = target.value as EventId;

    if (target.checked && state.competition) {
      state.psychSheets[eventId] ??= await fetchPsychSheet(
        state.canConfigureCompetition ? client : publicClient,
        state.competition.id,
        eventId,
      );
    }

    state.selectedEventIds = Array.from(
      app.querySelectorAll<HTMLInputElement>("input[name=event]:checked"),
    ).map((input) => input.value as EventId);

    render();
  };

  const handleChange = async (event: Event) => {
    try {
      const target = event.target as HTMLElement;
      if (target.id === "custom-tags-config") {
        const form = app.querySelector<HTMLFormElement>("#custom-tags-form");
        if (form) updateSelectedCustomTagsFromForm(form);
        const index = Number((target as HTMLSelectElement).value);
        state.selectedCustomTagIndex =
          Number.isInteger(index) && state.customTags[index] ? index : -1;
        state.message = undefined;
        render();
        return;
      }
      if (
        target.closest("#custom-tags-form")
      ) {
        handleCustomInput(event);
        return;
      }
      await handleEventChange(event.target as HTMLInputElement);
    } catch (error) {
      if (handleUnauthorized(error, state.canConfigureCompetition)) return;

      state.message = getErrorMessage(error, "Couldn't load the psych sheet.");
      render();
    }
  };

  const handleSubmit = async (event: SubmitEvent) => {
    const form = event.target as HTMLFormElement;
    if (form.id === "add-custom-tags-form") {
      event.preventDefault();
      return;
    }
    if (form.id === "custom-tags-form") {
      event.preventDefault();
      updateSelectedCustomTagsFromForm(form);
      return;
    }

    if (
      form.id !== "competition-settings-form" ||
      !state.canConfigureCompetition ||
      !state.wcif ||
      !state.competition
    ) {
      return;
    }

    event.preventDefault();

    try {
      const formData = new FormData(form);
      const currentRegion = getRegion(
        state.wcif,
        state.competition.countryIso2 ?? "",
      );
      const region = getRegionFromForm(formData, currentRegion);
      const logoUrl = formData.get("logoUrl")?.toString().trim() ?? "";
      const paperSize =
        formData.get("paperSize") === "letter" ? "letter" : "a4";
      const currentData = getFinaltagsData(state.wcif);
      const extensions = buildCompetitionExtensions(state.wcif, {
        logoUrl,
        region,
        paperSize,
        customTags: currentData?.customTags,
      });
      const wcif = { ...state.wcif, extensions };

      if (!wcif.formatVersion) {
        throw new Error("The WCIF has no formatVersion.");
      }

      await patchCompetitionExtensions(client, state.competition.id, wcif);

      state.wcif = wcif;
      state.message = "Saved";
      renderConfiguration(app, state);
    } catch (error) {
      if (handleUnauthorized(error)) return;

      state.message = getErrorMessage(error, "Couldn't save the settings.");
      renderConfiguration(app, state);
    }
  };

  const handleCustomInput = (event: Event) => {
    const target = event.target as HTMLElement;
    const form = target.closest<HTMLFormElement>("#custom-tags-form");
    if (!form) return;

    updateSelectedCustomTagsFromForm(form);
    state.message = undefined;
    form.querySelector(".message")?.remove();
    if (target instanceof HTMLSelectElement) {
      const fieldset = target.closest<HTMLElement>(".custom-tag-competitor");
      const index = fieldset
        ? Array.from(
            app.querySelectorAll<HTMLElement>(".custom-tag-competitor"),
          ).indexOf(fieldset)
        : -1;
      if (target.name === "personId" && index >= 0) {
        const person = state.wcif?.persons.find(
          (candidate) =>
            candidate.registrantId?.toString() === target.value,
        );
        const competitor = getSelectedCustomTags().competitors[index];
        if (competitor) {
          competitor.flag = person?.countryIso2 ?? "";
          competitor.flagUrl = "";
        }
      }
      renderCustomTags(app, state);
      return;
    }
  };

  return {
    async start() {
      state.token = getTokenFromHash();
      client.setToken(state.token);

      app.addEventListener("click", (event) => {
        void handleClick(event as MouseEvent);
      });
      app.addEventListener("change", (event) => {
        void handleChange(event);
      });
      app.addEventListener("input", handleCustomInput);
      app.addEventListener("submit", (event) => {
        void handleSubmit(event as SubmitEvent);
      });
      window.addEventListener("popstate", () => {
        void openRoute();
      });

      await openRoute();
    },
  };
};
