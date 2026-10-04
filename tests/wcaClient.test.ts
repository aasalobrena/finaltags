import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchManagedCompetitions } from "../src/api/competitionApi";
import { WcaApiError, WcaClient } from "../src/api/wcaClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WcaClient", () => {
  it("preserves the HTTP status when a request is unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(new WcaClient("expired-token").get("/countries")).rejects.toMatchObject({
      name: "WcaApiError",
      status: 401,
      message: "WCA responded with 401.",
    });
  });

  it("preserves the HTTP status for paginated requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(new WcaClient("expired-token").getAll("/competitions")).rejects.toBeInstanceOf(
      WcaApiError,
    );
  });

  it("does not treat forbidden responses as an expired token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 403 })),
    );

    await expect(new WcaClient("token").get("/countries")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("does not swallow unauthorized errors from optional country loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response("[]", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );

    await expect(fetchManagedCompetitions(new WcaClient("expired-token"))).rejects.toMatchObject({
      status: 401,
    });
  });
});
