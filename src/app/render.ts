import type { AppState } from "../types/app";
import { renderCompetitionList } from "../views/competitionList";
import { renderConfiguration } from "../views/configuration";
import { renderLoading, renderLogin } from "../views/login";
import { renderPrinting } from "../views/printing";
import { renderCustomTags } from "../views/customTags";

export const renderApp = (app: HTMLElement, state: AppState) => {
  if (!state.token) {
    renderLogin(app, state);
    return;
  }

  if (!state.competition || !state.wcif) {
    renderCompetitionList(app, state);
    return;
  }

  if (state.view === "tags") {
    renderCustomTags(app, state);
    return;
  }

  if (state.view === "config") {
    renderConfiguration(app, state);
    return;
  }

  renderPrinting(app, state);
};

export { renderLoading };
