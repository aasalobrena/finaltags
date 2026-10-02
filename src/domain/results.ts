import {
  decodeMultiResult,
  formatCentiseconds,
  formatMultiResult,
  getEventResultType,
} from "@wca/helpers";
import type { EventId } from "../types/wcif";

export const formatResult = (eventId: EventId, value?: number) => {
  if (!value) return "-";

  switch (getEventResultType(eventId)) {
    case "multi":
      return formatMultiResult(decodeMultiResult(value));
    case "number":
      return value.toString();
    default:
      return formatCentiseconds(value);
  }
};
