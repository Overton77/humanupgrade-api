import type { OrganizationSearchInput } from "../../../graphql/inputs/SearchInputs.js";
import { OrganizationSearchInputSchema } from "../../../graphql/inputs/SearchInputs.js"; 
import { ORGANIZATION_MODE_RUNNERS } from "./organizationSearchModes.js";
import type { OrganizationSearchResult } from "../../../graphql/types/SearchModel.js";
import type { SearchMode } from "../../../graphql/enums/index.js";
import { validateInput } from "../../../lib/validation.js";
import { normalizeSearchMode } from "../utils/normalize.js";
import type { EntitySearchDeps } from "../types.js";

export async function searchOrganizations(
  input: OrganizationSearchInput,
  deps: EntitySearchDeps = {}
): Promise<OrganizationSearchResult> {
  const validatedInput = validateInput(
    OrganizationSearchInputSchema,
    input,
    "OrganizationSearchInput"
  );

  const mode: SearchMode = normalizeSearchMode(validatedInput.mode);

  const runner = ORGANIZATION_MODE_RUNNERS[mode];
  return runner({ validatedInput, deps });
}