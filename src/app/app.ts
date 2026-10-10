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
import { buildCompetitionExtensions } from "../domain/extension";
import { getRegion } from "../domain/region";
import { renderRegionOptions } from "../components/regionOptions";
import { getRegionFromForm } from "../ui/forms";
import { renderConfiguration } from "../views/configuration";
import { createInitialState } from "./state";
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
        state.view = "list";
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

  const handleAction = async (action: string) => {
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
      case "download-pdf": {
        if (!state.competition) return;

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
      const action =
        target.closest<HTMLElement>("[data-action]")?.dataset.action;
      if (!action) return;

      await handleAction(action);
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
      await handleEventChange(event.target as HTMLInputElement);
    } catch (error) {
      if (handleUnauthorized(error, state.canConfigureCompetition)) return;

      state.message = getErrorMessage(error, "Couldn't load the psych sheet.");
      render();
    }
  };

  const handleSubmit = async (event: SubmitEvent) => {
    const form = event.target as HTMLFormElement;
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
      const extensions = buildCompetitionExtensions(state.wcif, {
        logoUrl,
        region,
        paperSize,
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
