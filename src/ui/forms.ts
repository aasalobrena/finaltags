import type { RegionConfig, RegionType } from "../types/wcif";

export const getRegionFromForm = (
  formData: FormData,
  currentRegion: RegionConfig,
): RegionConfig => {
  const prioritizeLocals = formData.get("prioritizeLocals") === "on";
  const regionType = formData.get("regionType")?.toString() as
    | RegionType
    | undefined;
  const regionId = formData.get("regionId")?.toString() ?? "";

  return prioritizeLocals && regionType && regionType !== "world"
    ? { type: regionType, id: regionId, prioritizeLocals: true }
    : { ...currentRegion, prioritizeLocals: false };
};
