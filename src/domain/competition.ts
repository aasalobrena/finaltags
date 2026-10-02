import type { Competition as Wcif, Result, Round } from "@wca/helpers";
import type {
  ApiCountry,
  FinaltagsExtensionData,
  Competitor,
  EventId,
  PsychSheet,
  RegionConfig,
  WcifWithParticipation,
} from "../types";
import { WCIF_EXTENSION_ID } from "../config";

export const getFinaltagsExtension = (wcif?: Wcif) =>
  wcif?.extensions?.find((extension) => extension.id === WCIF_EXTENSION_ID) as
    | (Wcif["extensions"][number] & {
        data?: FinaltagsExtensionData;
      })
    | undefined;

export const getRegion = (
  wcif: Wcif | undefined,
  competitionCountryIso2 = "",
): RegionConfig =>
  getFinaltagsExtension(wcif)?.data?.region ?? {
    type: "country",
    id: competitionCountryIso2,
    prioritizeLocals: false,
  };

export const getLogo = (wcif: Wcif) =>
  getFinaltagsExtension(wcif)?.data?.logoUrl ?? "";

export const getPaperSize = (wcif?: Wcif) =>
  getFinaltagsExtension(wcif)?.data?.paperSize === "letter" ? "letter" : "a4";

export const getRoundActivityIds = (wcif: Wcif, roundId: string) =>
  wcif.schedule?.venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .filter((activity) => activity.activityCode === roundId)
    .flatMap((activity) => activity.childActivities ?? [])
    .map((activity) => activity.id) ?? [];

const isAverageRound = (round: Round) =>
  round.format === "a" || round.format === "m";

const scoreForRound = (result: Result, round: Round) =>
  isAverageRound(round)
    ? (result.average ?? result.best ?? 0)
    : (result.best ?? result.average ?? 0);

const getContinentId = (countries: ApiCountry[], country: string) => {
  const match = countries.find((candidate) => candidate.iso2 === country);
  return match?.continent_id ?? match?.continentId;
};

const isLocalCompetitor = (
  countries: ApiCountry[],
  country: string,
  region: RegionConfig,
) =>
  region.type === "world" ||
  (region.type === "country" && country === region.id) ||
  (region.type === "continent" &&
    getContinentId(countries, country) === region.id);

export const deriveCompetitors = ({
  wcif,
  eventId,
  countries,
  psychSheet,
  competitionCountryIso2,
}: {
  wcif: WcifWithParticipation;
  eventId: EventId;
  countries: ApiCountry[];
  psychSheet?: PsychSheet;
  competitionCountryIso2?: string;
}): Competitor[] => {
  const rounds =
    wcif.events.find((event) => event.id === eventId)?.rounds ?? [];
  const finalRound = rounds.at(-1);

  if (!finalRound?.results.length) return [];

  const finalIds = new Set(finalRound.results.map((result) => result.personId));
  const activityIds = new Set(getRoundActivityIds(wcif, finalRound.id));
  const region = getRegion(wcif, competitionCountryIso2);
  const source = finalRound.participationRuleset?.participationSource;

  const sourceRounds =
    source?.type === "round"
      ? rounds.filter((round) => round.id === source.roundId)
      : source?.type === "linkedRounds"
        ? rounds.filter((round) => source.roundIds.includes(round.id))
        : rounds.length > 1
          ? [rounds.at(-2)!]
          : [finalRound];

  const sourceResults = sourceRounds.flatMap((round) =>
    round.results.filter((result) => finalIds.has(result.personId)),
  );

  const sortedSourceResults = sourceResults.slice().sort((left, right) => {
    const leftRound =
      sourceRounds.find((round) => round.results.includes(left)) ??
      sourceRounds[0];
    const rightRound =
      sourceRounds.find((round) => round.results.includes(right)) ??
      sourceRounds[0];

    return scoreForRound(left, leftRound) - scoreForRound(right, rightRound);
  });

  const sourceRankByPerson = new Map<number, number>();
  sortedSourceResults.forEach((result, index) => {
    if (!sourceRankByPerson.has(result.personId)) {
      sourceRankByPerson.set(
        result.personId,
        source?.type === "linkedRounds"
          ? index + 1
          : (result.ranking ?? index + 1),
      );
    }
  });

  const rawCompetitors = finalRound.results.map((result) => {
    const person = wcif.persons.find(
      (candidate) => candidate.registrantId === result.personId,
    );
    const sourceResult = sourceResults.find(
      (candidate) => candidate.personId === result.personId,
    );
    const sourceRound =
      sourceRounds.find((round) => round.results.includes(sourceResult!)) ??
      sourceRounds[0];

    const psychRanking =
      psychSheet?.sorted_rankings.find(
        (ranking) => ranking.wca_id === person?.wcaId,
      ) ??
      psychSheet?.sorted_rankings.find(
        (ranking) =>
          ranking.name === person?.name &&
          ranking.country_iso2 === person?.countryIso2,
      );

    const assignment = person?.assignments?.find(
      (candidate) =>
        activityIds.has(candidate.activityId) &&
        candidate.assignmentCode === "competitor",
    );

    const resultValue = isAverageRound(sourceRound)
      ? (sourceResult?.average ?? sourceResult?.best)
      : (sourceResult?.best ?? sourceResult?.average);
    const country = person?.countryIso2 ?? "";
    const psychResult =
      source?.type === "registrations"
        ? isAverageRound(finalRound)
          ? psychRanking?.average_best
          : psychRanking?.single_best
        : undefined;

    return {
      name: person?.name ?? "Unknown competitor",
      country,
      realSeed:
        source?.type === "registrations"
          ? (psychRanking?.pos ?? 0)
          : (sourceRankByPerson.get(result.personId) ?? result.ranking ?? 0),
      result: psychResult ?? resultValue ?? 0,
      station: assignment?.stationNumber ?? 0,
      isLocal: isLocalCompetitor(countries, country, region),
    };
  });

  return rawCompetitors
    .map((competitor) => ({
      name: competitor.name,
      country: competitor.country,
      seed:
        competitor.realSeed -
        (region.prioritizeLocals && competitor.isLocal
          ? rawCompetitors.filter(
              (other) => !other.isLocal && other.realSeed < competitor.realSeed,
            ).length
          : 0),
      result: competitor.result,
      station: competitor.station,
      isLocal: competitor.isLocal,
    }))
    .sort(
      (left, right) =>
        (region.prioritizeLocals
          ? Number(!right.isLocal) - Number(!left.isLocal)
          : 0) ||
        left.station - right.station ||
        left.seed - right.seed,
    );
};
