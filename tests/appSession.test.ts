import { afterEach, describe, expect, it, vi } from "vitest";
import { TOKEN_STORAGE_KEY } from "../src/config";
import { createApp } from "../src/app/app";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("expired WCA session", () => {
  it("clears the saved token and shows the login screen after a 401", async () => {
    const removeItem = vi.fn();
    const app = {
      innerHTML: "",
      addEventListener: vi.fn(),
    };
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("expired-token"),
      removeItem,
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    vi.stubGlobal("PopStateEvent", class {});
    vi.stubGlobal("window", {
      location: {
        pathname: "/finaltags/",
        hash: "",
        origin: "https://aasalobrena.github.io",
      },
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      setTimeout,
    });

    await createApp(app as unknown as HTMLElement).start();

    expect(removeItem).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
    expect(app.innerHTML).toContain("Your WCA session has expired");
    expect(app.innerHTML).toContain("Sign in with WCA");
    expect(app.innerHTML).not.toContain("Sign out");
  });
});

describe("public competition printing", () => {
  it("loads an unmanaged competition's public WCIF and redirects settings to printing", async () => {
    const app = {
      innerHTML: "",
      addEventListener: vi.fn(),
    };
    const replaceState = vi.fn();
    const wcif = {
      formatVersion: "2.1",
      id: "Public_2026",
      name: "Public competition",
      shortName: "Public",
      persons: [],
      events: [],
      schedule: {
        startDate: "2026-10-10",
        numberOfDays: 1,
        venues: [],
      },
      series: [],
      competitorLimit: null,
      extensions: [],
      registrationInfo: {
        openTime: "2026-01-01T00:00:00Z",
        closeTime: "2026-01-02T00:00:00Z",
        baseEntryFee: 0,
        currencyCode: "EUR",
        onTheSpotRegistration: false,
        useWcaRegistration: false,
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(wcif), { status: 200 }),
      );

    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("valid-token"),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("document", {
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue({}),
      head: { append: vi.fn() },
    });
    vi.stubGlobal("window", {
      location: {
        pathname: "/Public_2026/configuration",
        hash: "",
        origin: "https://aasalobrena.github.io",
      },
      history: {
        pushState: vi.fn(),
        replaceState,
      },
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      setTimeout,
    });

    await createApp(app as unknown as HTMLElement).start();

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://www.worldcubeassociation.org/api/v0/competitions/Public_2026/wcif/version/2",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
    expect(app.innerHTML).toContain("Public competition");
    expect(app.innerHTML).toContain("Print");
    expect(app.innerHTML).not.toContain("Settings");
    expect(replaceState).toHaveBeenCalledWith(
      {},
      "",
      "/Public_2026/printing",
    );
  });
});
