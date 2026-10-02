import type { AppState } from "../types/app";
import { escapeHtml } from "../ui/html";

export const renderShell = (state: AppState, content: string) =>
  `<header class="topbar"><a class="brand" href=${import.meta.env.BASE_URL} data-link>FinalTags</a>${state.token ? `<button class="link-button" data-action="logout">Sign out</button>` : ""}</header><main class="content">${content}</main>`;

export const renderNotice = (message: string | undefined, ok = false) =>
  message
    ? `<p class="message${ok ? "" : " message--error"}">${escapeHtml(message)}</p>`
    : "";
