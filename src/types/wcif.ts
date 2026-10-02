import type { Competition as Wcif, EventId, Result, Round } from "@wca/helpers";

export type ParticipationSource =
  | { type: "registrations" }
  | { type: "round"; roundId: string }
  | { type: "linkedRounds"; roundIds: string[] };

export type RoundWithParticipation = Round & {
  participationRuleset?: {
    participationSource?: ParticipationSource;
  };
};

export type WcifWithParticipation = Omit<Wcif, "events"> & {
  events: Array<
    Omit<Wcif["events"][number], "rounds"> & {
      rounds: RoundWithParticipation[];
    }
  >;
};

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
};

export type { EventId, Result, Round, Wcif };
