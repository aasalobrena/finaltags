import { WCA_API_BASE } from "../config";

const wait = (seconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, seconds * 1000));

export class WcaClient {
  #token: string | null;

  constructor(token: string | null = null) {
    this.#token = token;
  }

  setToken(token: string | null) {
    this.#token = token;
  }

  #headers(extra?: HeadersInit): HeadersInit {
    return {
      Accept: "application/json",
      ...(this.#token ? { Authorization: `Bearer ${this.#token}` } : {}),
      ...(extra ?? {}),
    };
  }

  async #fetchWithRateLimit(
    url: string,
    init: RequestInit = {},
  ): Promise<Response> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, init);

      if (response.status !== 429 || init.method === "PATCH") {
        return response;
      }

      const retryAfter = Number(response.headers.get("Retry-After") ?? 1);
      await wait(Math.min(Math.max(retryAfter, 1), 5));
    }

    return fetch(url, init);
  }

  async get<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.#fetchWithRateLimit(`${WCA_API_BASE}${path}`, {
      ...init,
      headers: this.#headers(init.headers),
    });

    if (!response.ok) {
      throw new Error(`WCA responded with ${response.status}.`);
    }

    return (await response.json()) as T;
  }

  async getAll<T>(path: string): Promise<T[]> {
    const results: T[] = [];

    for (let page = 1; page <= 100; page += 1) {
      const separator = path.includes("?") ? "&" : "?";
      const response = await this.#fetchWithRateLimit(
        `${WCA_API_BASE}${path}${separator}page=${page}&per_page=100`,
        { headers: this.#headers() },
      );

      if (response.status === 429 && page === 1) {
        throw new Error(
          "WCA is temporarily rate-limiting requests. Wait a few seconds and refresh.",
        );
      }

      if (!response.ok) {
        throw new Error(`WCA responded with ${response.status}.`);
      }

      const pageResults = (await response.json()) as T[];
      results.push(...pageResults);

      const hasNext = response.headers.get("Link")?.includes('rel="next"');

      if (!hasNext && pageResults.length < 100) {
        break;
      }
    }

    return results;
  }
}
