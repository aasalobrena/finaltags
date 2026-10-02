import type { AppState } from "../types/app";
import { renderNotice, renderShell } from "../components/shell";

export const renderLoading = (app: HTMLElement, state: AppState) => {
  app.innerHTML = renderShell(state, `<p class="empty">Loading…</p>`);
};

export const renderLogin = (app: HTMLElement, state: AppState) => {
  app.innerHTML = renderShell(
    state,
    `<section class="login"><h1>Print the cards for your finals</h1><p>Sign in with your WCA account to see the competitions you manage.</p><button class="button" data-action="login">Sign in with WCA</button>${renderNotice(state.message)}</section>`,
  );
};
