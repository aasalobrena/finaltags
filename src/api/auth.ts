import { TOKEN_STORAGE_KEY, WCA_CLIENT_ID } from "../config";

const redirectUri = () =>
  `${window.location.origin}${window.location.pathname}`;

export const getTokenFromHash = (): string | null => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");

  if (token) {
    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return token;
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const startWcaLogin = (): string | null => {
  if (!WCA_CLIENT_ID) {
    return "Set VITE_WCA_CLIENT_ID in your environment to the Application ID of your OAuth app.";
  }

  const params = new URLSearchParams({
    client_id: WCA_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "token",
    scope: "public manage_competitions",
  });

  window.location.assign(
    `https://www.worldcubeassociation.org/oauth/authorize?${params}`,
  );

  return null;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};
