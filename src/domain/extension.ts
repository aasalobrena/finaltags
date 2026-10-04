import type { Competition as Wcif } from "@wca/helpers";
import { WCIF_EXTENSION_ID, WCIF_EXTENSION_SPEC } from "../config";
import type {
  FinaltagsExtensionData,
  RegionConfig,
  WcifWithParticipation,
} from "../types/wcif";

type FinaltagsExtension = NonNullable<Wcif["extensions"]>[number] & {
  data?: FinaltagsExtensionData;
};

export const getFinaltagsExtension = (
  wcif?: Wcif,
): FinaltagsExtension | undefined =>
  wcif?.extensions?.find((extension) => extension.id === WCIF_EXTENSION_ID) as
    | FinaltagsExtension
    | undefined;

export const getFinaltagsData = (wcif?: Wcif) =>
  getFinaltagsExtension(wcif)?.data;

export const getLogo = (wcif?: Wcif) => getFinaltagsData(wcif)?.logoUrl ?? "";

export const buildCompetitionExtensions = (
  wcif: WcifWithParticipation,
  data: FinaltagsExtensionData & {
    region: RegionConfig;
    paperSize: NonNullable<FinaltagsExtensionData["paperSize"]>;
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
