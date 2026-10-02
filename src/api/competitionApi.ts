import { WCIF_MAJOR_VERSION } from "../config";
import type { ApiCompetition, ApiCountry, PsychSheet } from "../types/api";
import type { CompetitionSummary } from "../types/domain";
import type { EventId, WcifWithParticipation } from "../types/wcif";
import { WcaClient } from "./wcaClient";

export const fetchManagedCompetitions = async (client: WcaClient) => {
  const competitions = await client.getAll<ApiCompetition>(
    "/competitions?managed_by_me=true",
  );

  let countries: ApiCountry[] = [];
  try {
    countries = await client.get<ApiCountry[]>("/countries");
  } catch {
    // Country data is optional for rendering the competition list.
  }

  const summaries: CompetitionSummary[] = competitions.map((competition) => ({
    id: competition.id,
    name: competition.name,
    cityName: competition.city_name,
    countryIso2: competition.country_iso2,
    startDate: competition.start_date,
  }));

  return { competitions: summaries, countries };
};

export const fetchPsychSheet = (
  client: WcaClient,
  competitionId: string,
  eventId: EventId,
) =>
  client.get<PsychSheet>(
    `/competitions/${encodeURIComponent(competitionId)}/psych-sheet/${encodeURIComponent(eventId)}`,
  );

export const fetchCompetitionWcif = (
  client: WcaClient,
  competitionId: string,
) =>
  client.get<WcifWithParticipation>(
    `/competitions/${encodeURIComponent(competitionId)}/wcif/version/${WCIF_MAJOR_VERSION}/`,
  );

export const patchCompetitionExtensions = (
  client: WcaClient,
  competitionId: string,
  formatVersion: string,
  extensions: WcifWithParticipation["extensions"],
) =>
  client.get(`/competitions/${encodeURIComponent(competitionId)}/wcif`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formatVersion,
      id: competitionId,
      extensions,
    }),
  });
