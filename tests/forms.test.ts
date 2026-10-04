import { describe, expect, it } from "vitest";
import type { RegionConfig } from "../src/types/wcif";
import { getRegionFromForm } from "../src/ui/forms";

const currentRegion: RegionConfig = {
  type: "country",
  id: "ES",
  prioritizeLocals: true,
};

describe("getRegionFromForm", () => {
  it("reads an enabled continent region", () => {
    const formData = new FormData();
    formData.set("prioritizeLocals", "on");
    formData.set("regionType", "continent");
    formData.set("regionId", "_Europe");

    expect(getRegionFromForm(formData, currentRegion)).toEqual({
      type: "continent",
      id: "_Europe",
      prioritizeLocals: true,
    });
  });

  it("disables prioritization while preserving the saved region", () => {
    const formData = new FormData();

    expect(getRegionFromForm(formData, currentRegion)).toEqual({
      ...currentRegion,
      prioritizeLocals: false,
    });
  });

  it("does not save the non-selectable world region from form input", () => {
    const formData = new FormData();
    formData.set("prioritizeLocals", "on");
    formData.set("regionType", "world");

    expect(getRegionFromForm(formData, currentRegion)).toEqual({
      ...currentRegion,
      prioritizeLocals: false,
    });
  });
});
