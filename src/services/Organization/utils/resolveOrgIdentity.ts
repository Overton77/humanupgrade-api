import { OrgIdentifierKey } from "../types.js";  
import {Errors} from "../../../lib/errors.js";


export function resolveOrgIdentifier(params: {
  organizationId?: string | null;
  legalName?: string | null;
  publicTicker?: string | null;
}): { key: OrgIdentifierKey; value: string } {
  const pairs = ([
    ["organizationId", params.organizationId],
    ["legalName", params.legalName],
    ["publicTicker", params.publicTicker],
  ] as const).filter(([, v]) => typeof v === "string" && v.trim().length > 0);

  if (pairs.length === 0) {
    throw Errors.invalidInput(
      "One of organizationId, legalName, or publicTicker is required."
    );
  }

  // optional: enforce user only provided one identifier
  // if you prefer resolver enforces this, you can remove this guard
  const uniqueKeys = new Set(pairs.map(([k]) => k));
  if (uniqueKeys.size > 1) {
    throw Errors.invalidInput(
      "Provide exactly one identifier: organizationId OR legalName OR publicTicker."
    );
  }

  const [key, value] = pairs[0];
  return { key, value: value!.trim() };
}
