import { personNodeSetBlockCreate } from "./personNodeSetBlock.js";

// Shared relationship SET block (claimIds + temporal validity) - used by all Org->Person edges
const relSetBlock = (relVar: string) => `
    claimIds: CASE
      WHEN ${relVar}.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(${relVar}.claimIds, []))
    END,
    createdAt: CASE WHEN ${relVar}.createdAt IS NULL THEN r.createdAt ELSE ${relVar}.createdAt END,
    validAt: CASE WHEN ${relVar}.validAt IS NULL THEN r.validAt ELSE ${relVar}.validAt END,
    invalidAt: CASE WHEN ${relVar}.invalidAt IS NULL THEN r.invalidAt ELSE ${relVar}.invalidAt END,
    expiredAt: CASE WHEN ${relVar}.expiredAt IS NULL THEN r.expiredAt ELSE ${relVar}.expiredAt END
`;

const buildPersonCreateConnectCypher = (
  paramName: string,
  relType: string,
  relProps: string
) => `
MATCH (o:Organization {organizationId: $organizationId})
UNWIND coalesce($` + paramName + `, []) AS rel
CALL {
  WITH o, rel
  WITH o, rel WHERE rel.person.create IS NOT NULL

  MERGE (p:Person { personId: coalesce(rel.person.create.personId, randomUUID()) })
  ON CREATE SET p.createdAt = datetime()
  ${personNodeSetBlockCreate("rel.person.create")}

  MERGE (o)-[r:${relType}]->(p)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    ${relProps},
    ${relSetBlock("rel").trim()}
  }
  RETURN 1 AS ok

  UNION

  WITH o, rel
  WITH o, rel WHERE rel.person.connect IS NOT NULL

  OPTIONAL MATCH (p:Person {personId: rel.person.connect.personId})
  WITH o, rel, p
  CALL apoc.util.validate(
    p IS NULL,
    '${relType} connect failed: Person not found for personId %s',
    [rel.person.connect.personId]
  )

  MERGE (o)-[r:${relType}]->(p)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    ${relProps},
    ${relSetBlock("rel").trim()}
  }
  RETURN 1 AS ok
}
RETURN 1 AS ok
`;

const buildPersonUpdateCypher = (
  paramName: string,
  relType: string,
  relProps: string
) => `
MATCH (o:Organization {organizationId: $organizationId})
UNWIND $` + paramName + ` AS rel
CALL {
  WITH o, rel
  WITH o, rel WHERE rel.person.create IS NOT NULL

  MERGE (p:Person { personId: coalesce(rel.person.create.personId, randomUUID()) })
  ON CREATE SET p.createdAt = datetime()
  ${personNodeSetBlockCreate("rel.person.create")}

  MERGE (o)-[r:${relType}]->(p)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    ${relProps},
    ${relSetBlock("rel").trim()}
  }
  RETURN 1 AS ok

  UNION

  WITH o, rel
  WITH o, rel WHERE rel.person.connect IS NOT NULL

  OPTIONAL MATCH (p:Person {personId: rel.person.connect.personId})
  CALL apoc.util.validate(
    p IS NULL,
    '${relType} connect failed: Person not found for personId %s',
    [rel.person.connect.personId]
  )

  MERGE (o)-[r:${relType}]->(p)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    ${relProps},
    ${relSetBlock("rel").trim()}
  }
  RETURN 1 AS ok

  UNION

  WITH o, rel
  WITH o, rel WHERE rel.person.update IS NOT NULL

  CALL apoc.util.validate(
    rel.person.update.personId IS NULL,
    '${relType} update failed: person.update.personId is required',
    []
  )

  OPTIONAL MATCH (p:Person {personId: rel.person.update.personId})
  OPTIONAL MATCH (o)-[r:${relType}]->(p)
  CALL apoc.util.validate(
    p IS NULL,
    '${relType} update failed: Person not found for personId %s',
    [rel.person.update.personId]
  )
  CALL apoc.util.validate(
    r IS NULL,
    '${relType} update failed: relationship not found for org %s -> person %s',
    [$organizationId, rel.person.update.personId]
  )

  ${personNodeSetBlockCreate("rel.person.update")}
  SET r += {
    ${relProps},
    ${relSetBlock("rel").trim()}
  }
  RETURN 1 AS ok
}
RETURN count(*) AS _
`;

// EMPLOYS
const employsRelProps = `
  roleTitle: CASE WHEN rel.roleTitle IS NULL THEN r.roleTitle ELSE rel.roleTitle END,
  department: CASE WHEN rel.department IS NULL THEN r.department ELSE rel.department END,
  roleFunction: CASE WHEN rel.roleFunction IS NULL THEN r.roleFunction ELSE rel.roleFunction END,
  seniority: CASE WHEN rel.seniority IS NULL THEN r.seniority ELSE rel.seniority END,
  employmentType: CASE WHEN rel.employmentType IS NULL THEN r.employmentType ELSE rel.employmentType END,
  startDate: CASE WHEN rel.startDate IS NULL THEN r.startDate ELSE rel.startDate END,
  endDate: CASE WHEN rel.endDate IS NULL THEN r.endDate ELSE rel.endDate END,
  isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r.isCurrent ELSE rel.isCurrent END
`;
export const organizationEmploysCypher = buildPersonCreateConnectCypher(
  "employs",
  "EMPLOYS",
  employsRelProps
);
export const updateOrganizationEmploysCypher = buildPersonUpdateCypher(
  "employs",
  "EMPLOYS",
  employsRelProps
);

// FOUNDED_BY
const foundedByRelProps = `
  founderRole: CASE WHEN rel.founderRole IS NULL THEN r.founderRole ELSE rel.founderRole END,
  foundingDate: CASE WHEN rel.foundingDate IS NULL THEN r.foundingDate ELSE rel.foundingDate END
`;
export const organizationFoundedByCypher = buildPersonCreateConnectCypher(
  "foundedBy",
  "FOUNDED_BY",
  foundedByRelProps
);
export const updateOrganizationFoundedByCypher = buildPersonUpdateCypher(
  "foundedBy",
  "FOUNDED_BY",
  foundedByRelProps
);

// HAS_BOARD_MEMBER
const hasBoardMemberRelProps = `
  boardRole: CASE WHEN rel.boardRole IS NULL THEN r.boardRole ELSE rel.boardRole END,
  committee: CASE WHEN rel.committee IS NULL THEN r.committee ELSE rel.committee END,
  startDate: CASE WHEN rel.startDate IS NULL THEN r.startDate ELSE rel.startDate END,
  endDate: CASE WHEN rel.endDate IS NULL THEN r.endDate ELSE rel.endDate END,
  isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r.isCurrent ELSE rel.isCurrent END
`;
export const organizationHasBoardMemberCypher = buildPersonCreateConnectCypher(
  "hasBoardMember",
  "HAS_BOARD_MEMBER",
  hasBoardMemberRelProps
);
export const updateOrganizationHasBoardMemberCypher = buildPersonUpdateCypher(
  "hasBoardMember",
  "HAS_BOARD_MEMBER",
  hasBoardMemberRelProps
);

// HAS_SCIENTIFIC_ADVISOR
const hasScientificAdvisorRelProps = `
  advisorType: CASE WHEN rel.advisorType IS NULL THEN r.advisorType ELSE rel.advisorType END,
  focusAreas: CASE
    WHEN rel.focusAreas IS NULL THEN r.focusAreas
    ELSE apoc.coll.toSet(coalesce(r.focusAreas, []) + coalesce(rel.focusAreas, []))
  END,
  startDate: CASE WHEN rel.startDate IS NULL THEN r.startDate ELSE rel.startDate END,
  endDate: CASE WHEN rel.endDate IS NULL THEN r.endDate ELSE rel.endDate END,
  isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r.isCurrent ELSE rel.isCurrent END
`;
export const organizationHasScientificAdvisorCypher =
  buildPersonCreateConnectCypher(
    "hasScientificAdvisor",
    "HAS_SCIENTIFIC_ADVISOR",
    hasScientificAdvisorRelProps
  );
export const updateOrganizationHasScientificAdvisorCypher =
  buildPersonUpdateCypher(
    "hasScientificAdvisor",
    "HAS_SCIENTIFIC_ADVISOR",
    hasScientificAdvisorRelProps
  );

// HAS_EXECUTIVE_ROLE
const hasExecutiveRoleRelProps = `
  executiveRole: CASE WHEN rel.executiveRole IS NULL THEN r.executiveRole ELSE rel.executiveRole END,
  startDate: CASE WHEN rel.startDate IS NULL THEN r.startDate ELSE rel.startDate END,
  endDate: CASE WHEN rel.endDate IS NULL THEN r.endDate ELSE rel.endDate END,
  isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r.isCurrent ELSE rel.isCurrent END
`;
export const organizationHasExecutiveRoleCypher = buildPersonCreateConnectCypher(
  "hasExecutiveRole",
  "HAS_EXECUTIVE_ROLE",
  hasExecutiveRoleRelProps
);
export const updateOrganizationHasExecutiveRoleCypher = buildPersonUpdateCypher(
  "hasExecutiveRole",
  "HAS_EXECUTIVE_ROLE",
  hasExecutiveRoleRelProps
);
