import type { CustomTagsConfig } from "./domain";

export type RegionType = "world" | "continent" | "country";

export type RegionConfig = {
  type: RegionType;
  id: string;
  prioritizeLocals: boolean;
};

export type PaperSize = "a4" | "letter";

export type FinaltagsExtensionData = {
  logoUrl?: string;
  region?: RegionConfig;
  paperSize?: PaperSize;
  customTags?: CustomTagsConfig[];
};
