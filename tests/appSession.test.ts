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
