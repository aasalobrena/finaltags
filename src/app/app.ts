import type { EventId, RegionType } from "../types/wcif";
import {
  fetchCompetitionWcif,
  fetchManagedCompetitions,
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

  const render = () => renderApp(app, state);

  const handleUnauthorized = (error: unknown) => {
    if (!(error instanceof WcaApiError) || error.status !== 401) {
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

  const refreshCompetitions = async () => {
    const result = await fetchManagedCompetitions(client);
    state.competitions = result.competitions;
    state.countries = result.countries;
    state.message = undefined;
  };

  const loadCompetition = async (competitionId: string) => {
    const competition = state.competitions.find(
      (candidate) => candidate.id === competitionId,
    );

    if (!competition) {
      throw new Error(
        "You don't have access to that competition, or it doesn't exist.",
      );
    }

    renderLoading(app, state);
    const wcif = await fetchCompetitionWcif(client, competition.id);

    if (!wcif.formatVersion?.startsWith("2.")) {
      throw new Error(
        `WCA did not return WCIF v2 (received: ${wcif.formatVersion ?? "unknown"}).`,
      );
    }

    state.competition = competition;
    state.wcif = wcif;
    state.psychSheets = {};
    state.selectedEventIds = [];
  };

  const openRoute = async () => {
    const route = readRoute();
    state.message = undefined;

    if (!state.token) {
      render();
      return;
    }

    try {
      if (state.competitions.length === 0) {
        renderLoading(app, state);
        await refreshCompetitions();
      }

      if (!route.competitionId) {
        state.competition = undefined;
        state.wcif = undefined;
        state.view = "list";
        render();
        return;
      }

      if (state.competition?.id !== route.competitionId) {
        await loadCompetition(route.competitionId);
      }

      state.view = route.view;
      render();

      const path = pathFor(route.competitionId, route.view);
      if (window.location.pathname !== path) {
        window.history.replaceState({}, "", path);
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;

      state.competition = undefined;
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
      case "refresh":
        renderLoading(app, state);
        await refreshCompetitions();
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
        client,
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
      if (handleUnauthorized(error)) return;

      state.message = getErrorMessage(error, "Couldn't load the psych sheet.");
      render();
    }
  };

  const handleSubmit = async (event: SubmitEvent) => {
    const form = event.target as HTMLFormElement;
    if (
      form.id !== "competition-settings-form" ||
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

      if (!state.wcif.formatVersion) {
        throw new Error("The WCIF has no formatVersion.");
      }

      await patchCompetitionExtensions(
        client,
        state.competition.id,
        state.wcif.formatVersion,
        extensions,
      );

      state.wcif.extensions = extensions;
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
