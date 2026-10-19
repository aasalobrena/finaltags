import type { Competition } from "@wca/helpers";
import { WCIF_EXTENSION_ID, WCIF_EXTENSION_SPEC } from "../config";
import type {
  FinaltagsExtensionData,
  RegionConfig,
} from "../types/wcif";
import type { CustomTagsConfig } from "../types/domain";

type FinaltagsExtension = NonNullable<Competition["extensions"]>[number] & {
  data?: FinaltagsExtensionData;
};

export const getFinaltagsExtension = (
  wcif?: Competition,
): FinaltagsExtension | undefined =>
  wcif?.extensions?.find((extension) => extension.id === WCIF_EXTENSION_ID) as
    | FinaltagsExtension
    | undefined;

export const getFinaltagsData = (wcif?: Competition) =>
  getFinaltagsExtension(wcif)?.data;

export const getLogo = (wcif?: Competition) => getFinaltagsData(wcif)?.logoUrl ?? "";

export const buildCompetitionExtensions = (
  wcif: Pick<Competition, "extensions">,
  data: FinaltagsExtensionData & {
    region: RegionConfig;
    paperSize: NonNullable<FinaltagsExtensionData["paperSize"]>;
    customTags?: CustomTagsConfig[];
  },
) => [
  ...(wcif.extensions ?? []).filter(
    (extension) => extension.id !== WCIF_EXTENSION_ID,
  ),
  {
    id: WCIF_EXTENSION_ID,
    specUrl: WCIF_EXTENSION_SPEC,
    data,
  },
];
