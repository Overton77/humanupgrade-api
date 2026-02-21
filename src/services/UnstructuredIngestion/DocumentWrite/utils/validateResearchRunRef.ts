import { executeRead } from "../../../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../../../db/neo4j/utils.js";
import { validateResearchRunRefExistsCypher } from "../statements/documentStatements.js";
import { Errors } from "../../../../lib/errors.js";

/**
 * Validates that a ResearchRunRef exists by mongoRunId
 * @param mongoRunId - The mongoRunId to validate
 * @throws Error if ResearchRunRef does not exist
 */
export async function validateResearchRunRefExists(
  mongoRunId: string
): Promise<void> {
  const result = await executeRead(async (tx) => {
    const res = await tx.run(validateResearchRunRefExistsCypher, {
      mongoRunId,
    });
    return firstRecordOrNull(res);
  });

  if (!result) {
    throw Errors.notFound(
      "ResearchRunRef",
      `mongoRunId: ${mongoRunId}`
    );
  }
}
