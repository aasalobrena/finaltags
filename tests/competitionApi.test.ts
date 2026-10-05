import { afterEach, describe, expect, it, vi } from "vitest";
import { patchCompetitionExtensions } from "../src/api/competitionApi";
import { WcaApiError, WcaClient } from "../src/api/wcaClient";
import type { WcifWithParticipation } from "../src/types/wcif";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("patchCompetitionExtensions", () => {
  const wcif: WcifWithParticipation = {
    formatVersion: "2.1",
    id: "TestCompetition",
    name: "Test competition",
    shortName: "Test",
    persons: [],
    events: [],
    schedule: {
      startDate: "2025-01-01",
      numberOfDays: 1,
      venues: [],
    },
    series: [],
    competitorLimit: null,
    extensions: [],
    registrationInfo: {
      openTime: "2025-01-01T00:00:00Z",
      closeTime: "2025-01-02T00:00:00Z",
      baseEntryFee: 0,
      currencyCode: "USD",
      onTheSpotRegistration: false,
      useWcaRegistration: false,
    },
  };

  it("checks the updated WCIF before patching its extensions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await patchCompetitionExtensions(
      new WcaClient("token"),
      "TestCompetition",
      wcif,
    );

    const patchPayload = JSON.stringify({
      formatVersion: wcif.formatVersion,
      id: "TestCompetition",
      extensions: wcif.extensions,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://www.worldcubeassociation.org/api/v0/competitions/wcif/check",
      expect.objectContaining({
        method: "PUT",
        body: patchPayload,
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://www.worldcubeassociation.org/api/v0/competitions/TestCompetition/wcif",
      expect.objectContaining({
        method: "PATCH",
        body: patchPayload,
      }),
    );
  });

  it("does not patch when the schema check fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 422 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      patchCompetitionExtensions(
        new WcaClient("token"),
        "TestCompetition",
        wcif,
      ),
    ).rejects.toBeInstanceOf(WcaApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.worldcubeassociation.org/api/v0/competitions/wcif/check",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
