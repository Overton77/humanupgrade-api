import { StudyIdentifierKey } from "../types.js";

// ============================================================================
// Study Node Upsert
// ============================================================================

/**
 * Builds a parameterised MERGE Cypher for upserting the Study node.
 *
 * @param identifierKey — the property to MERGE on (studyId | doi | internalStudyCode)
 *
 * For the registryComposite case the service passes BOTH $registrySource and
 * $registryId and uses the dedicated `buildStudyRegistryUpsertCypher` below.
 */
export function buildStudyUpsertCypher(
  identifierKey: Exclude<StudyIdentifierKey, "registryComposite">
) {
  return `
MERGE (s:Study { ${identifierKey}: $idValue })
ON CREATE SET s.createdAt = datetime()

// Canonical id must always exist
SET s.studyId = coalesce(s.studyId, randomUUID())

SET s += {
  registrySource:     CASE WHEN $registrySource    IS NULL THEN s.registrySource    ELSE $registrySource    END,
  registryId:         CASE WHEN $registryId        IS NULL THEN s.registryId        ELSE $registryId        END,
  doi:                CASE WHEN $doi               IS NULL THEN s.doi               ELSE $doi               END,
  internalStudyCode:  CASE WHEN $internalStudyCode IS NULL THEN s.internalStudyCode ELSE $internalStudyCode END,
  canonicalTitle:     CASE WHEN $canonicalTitle    IS NULL THEN s.canonicalTitle    ELSE $canonicalTitle    END,
  studyKind:          CASE WHEN $studyKind         IS NULL THEN s.studyKind         ELSE $studyKind         END,
  shortTitle:         CASE WHEN $shortTitle        IS NULL THEN s.shortTitle        ELSE $shortTitle        END,
  aliases: CASE
    WHEN $aliases IS NULL THEN s.aliases
    ELSE apoc.coll.toSet(coalesce(s.aliases, []) + coalesce($aliases, []))
  END,
  designKind:      CASE WHEN $designKind      IS NULL THEN s.designKind      ELSE $designKind      END,
  status:          CASE WHEN $status          IS NULL THEN s.status          ELSE $status          END,
  phase:           CASE WHEN $phase           IS NULL THEN s.phase           ELSE $phase           END,
  sampleSize:      CASE WHEN $sampleSize      IS NULL THEN s.sampleSize      ELSE $sampleSize      END,
  randomized:      CASE WHEN $randomized      IS NULL THEN s.randomized      ELSE $randomized      END,
  blinded:         CASE WHEN $blinded         IS NULL THEN s.blinded         ELSE $blinded         END,
  comparatorType:  CASE WHEN $comparatorType  IS NULL THEN s.comparatorType  ELSE $comparatorType  END,
  keywords: CASE
    WHEN $keywords IS NULL THEN s.keywords
    ELSE apoc.coll.toSet(coalesce(s.keywords, []) + coalesce($keywords, []))
  END,
  locations: CASE
    WHEN $locations IS NULL THEN s.locations
    ELSE apoc.coll.toSet(coalesce(s.locations, []) + coalesce($locations, []))
  END,
  validAt:    CASE WHEN $validAt    IS NULL THEN s.validAt    ELSE $validAt    END,
  invalidAt:  CASE WHEN $invalidAt  IS NULL THEN s.invalidAt  ELSE $invalidAt  END,
  expiredAt:  CASE WHEN $expiredAt  IS NULL THEN s.expiredAt  ELSE $expiredAt  END
}

RETURN s
  `;
}

/**
 * MERGE on the (registrySource, registryId) composite key pair.
 */
export const buildStudyRegistryUpsertCypher = () => `
MERGE (s:Study { registrySource: $registrySource, registryId: $registryId })
ON CREATE SET s.createdAt = datetime()

SET s.studyId = coalesce(s.studyId, randomUUID())

SET s += {
  doi:               CASE WHEN $doi               IS NULL THEN s.doi               ELSE $doi               END,
  internalStudyCode: CASE WHEN $internalStudyCode IS NULL THEN s.internalStudyCode ELSE $internalStudyCode END,
  canonicalTitle:    CASE WHEN $canonicalTitle    IS NULL THEN s.canonicalTitle    ELSE $canonicalTitle    END,
  studyKind:         CASE WHEN $studyKind         IS NULL THEN s.studyKind         ELSE $studyKind         END,
  shortTitle:        CASE WHEN $shortTitle        IS NULL THEN s.shortTitle        ELSE $shortTitle        END,
  aliases: CASE
    WHEN $aliases IS NULL THEN s.aliases
    ELSE apoc.coll.toSet(coalesce(s.aliases, []) + coalesce($aliases, []))
  END,
  designKind:     CASE WHEN $designKind     IS NULL THEN s.designKind     ELSE $designKind     END,
  status:         CASE WHEN $status         IS NULL THEN s.status         ELSE $status         END,
  phase:          CASE WHEN $phase          IS NULL THEN s.phase          ELSE $phase          END,
  sampleSize:     CASE WHEN $sampleSize     IS NULL THEN s.sampleSize     ELSE $sampleSize     END,
  randomized:     CASE WHEN $randomized     IS NULL THEN s.randomized     ELSE $randomized     END,
  blinded:        CASE WHEN $blinded        IS NULL THEN s.blinded        ELSE $blinded        END,
  comparatorType: CASE WHEN $comparatorType IS NULL THEN s.comparatorType ELSE $comparatorType END,
  keywords: CASE
    WHEN $keywords IS NULL THEN s.keywords
    ELSE apoc.coll.toSet(coalesce(s.keywords, []) + coalesce($keywords, []))
  END,
  locations: CASE
    WHEN $locations IS NULL THEN s.locations
    ELSE apoc.coll.toSet(coalesce(s.locations, []) + coalesce($locations, []))
  END,
  validAt:   CASE WHEN $validAt   IS NULL THEN s.validAt   ELSE $validAt   END,
  invalidAt: CASE WHEN $invalidAt IS NULL THEN s.invalidAt ELSE $invalidAt END,
  expiredAt: CASE WHEN $expiredAt IS NULL THEN s.expiredAt ELSE $expiredAt END
}

RETURN s
`;

// ============================================================================
// EVALUATES (Study -> Product | CompoundForm | Compound | Food | FoodVariant)
//
// Uses a CASE dispatch on `evRel.target.kind` to route to the correct
// branch. Each branch does a CREATE (MERGE on target) or CONNECT
// (OPTIONAL MATCH + hard-fail validate) then creates the EVALUATES edge.
// ============================================================================

export const studyEvaluatesCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($evaluates, []) AS evRel
CALL {
  WITH s, evRel

  // ─── PRODUCT branch ───────────────────────────────────────────────────────
  WITH s, evRel WHERE evRel.target.kind = 'PRODUCT'
  CALL {
    WITH s, evRel
    WITH s, evRel WHERE evRel.target.createProduct IS NOT NULL

    MERGE (t:Product { productId: coalesce(evRel.target.createProduct.create.productId, randomUUID()) })
    ON CREATE SET t.createdAt = datetime()
    SET t += {
      name:          CASE WHEN evRel.target.createProduct.create.name          IS NULL THEN t.name          ELSE evRel.target.createProduct.create.name          END,
      productDomain: CASE WHEN evRel.target.createProduct.create.productDomain IS NULL THEN t.productDomain ELSE evRel.target.createProduct.create.productDomain END,
      validAt:       CASE WHEN evRel.target.createProduct.create.validAt       IS NULL THEN t.validAt       ELSE evRel.target.createProduct.create.validAt       END,
      invalidAt:     CASE WHEN evRel.target.createProduct.create.invalidAt     IS NULL THEN t.invalidAt     ELSE evRel.target.createProduct.create.invalidAt     END,
      expiredAt:     CASE WHEN evRel.target.createProduct.create.expiredAt     IS NULL THEN t.expiredAt     ELSE evRel.target.createProduct.create.expiredAt     END
    }
    MERGE (s)-[r:EVALUATES]->(t)
    ON CREATE SET r.createdAt = datetime()
    SET r += {
      targetKind:       'PRODUCT',
      role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
      strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
      extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
      extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
      validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
      invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
      expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
    }
    RETURN 1 AS ok

    UNION

    WITH s, evRel
    WITH s, evRel WHERE evRel.target.createProduct IS NULL AND evRel.target.productId IS NOT NULL
    OPTIONAL MATCH (t:Product { productId: evRel.target.productId })
    WITH s, evRel, t
    CALL apoc.util.validate(t IS NULL, 'EVALUATES(PRODUCT) connect failed: Product not found for productId %s', [evRel.target.productId])
    MERGE (s)-[r:EVALUATES]->(t)
    ON CREATE SET r.createdAt = datetime()
    SET r += {
      targetKind:       'PRODUCT',
      role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
      strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
      extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
      extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
      validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
      invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
      expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
    }
    RETURN 1 AS ok
  }
  RETURN 1 AS ok

  UNION

  // ─── COMPOUND_FORM branch ─────────────────────────────────────────────────
  WITH s, evRel
  WITH s, evRel WHERE evRel.target.kind = 'COMPOUND_FORM'
  CALL {
    WITH s, evRel
    WITH s, evRel WHERE evRel.target.createCompoundForm IS NOT NULL
    MERGE (t:CompoundForm { compoundFormId: coalesce(evRel.target.createCompoundForm.create.compoundFormId, randomUUID()) })
    ON CREATE SET t.createdAt = datetime()
    SET t += {
      canonicalName: CASE WHEN evRel.target.createCompoundForm.create.canonicalName IS NULL THEN t.canonicalName ELSE evRel.target.createCompoundForm.create.canonicalName END,
      formType:      CASE WHEN evRel.target.createCompoundForm.create.formType      IS NULL THEN t.formType      ELSE evRel.target.createCompoundForm.create.formType      END
    }
    MERGE (s)-[r:EVALUATES]->(t)
    ON CREATE SET r.createdAt = datetime()
    SET r += {
      targetKind:       'COMPOUND_FORM',
      role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
      strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
      extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
      extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
      validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
      invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
      expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
    }
    RETURN 1 AS ok

    UNION

    WITH s, evRel
    WITH s, evRel WHERE evRel.target.createCompoundForm IS NULL AND evRel.target.compoundFormId IS NOT NULL
    OPTIONAL MATCH (t:CompoundForm { compoundFormId: evRel.target.compoundFormId })
    WITH s, evRel, t
    CALL apoc.util.validate(t IS NULL, 'EVALUATES(COMPOUND_FORM) connect failed: CompoundForm not found for compoundFormId %s', [evRel.target.compoundFormId])
    MERGE (s)-[r:EVALUATES]->(t)
    ON CREATE SET r.createdAt = datetime()
    SET r += {
      targetKind:       'COMPOUND_FORM',
      role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
      strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
      extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
      extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
      validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
      invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
      expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
    }
    RETURN 1 AS ok
  }
  RETURN 1 AS ok

  UNION

  // ─── COMPOUND branch (connect-only until Compound node type is implemented) ─
  WITH s, evRel
  WITH s, evRel WHERE evRel.target.kind = 'COMPOUND'
  OPTIONAL MATCH (t:Compound { compoundId: evRel.target.compoundId })
  WITH s, evRel, t
  CALL apoc.util.validate(t IS NULL, 'EVALUATES(COMPOUND) connect failed: Compound not found for compoundId %s', [evRel.target.compoundId])
  MERGE (s)-[r:EVALUATES]->(t)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    targetKind:       'COMPOUND',
    role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
    strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
    extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
    validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
    invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ─── FOOD branch (connect-only until Food node type is implemented) ─────────
  WITH s, evRel
  WITH s, evRel WHERE evRel.target.kind = 'FOOD'
  OPTIONAL MATCH (t:Food { foodId: evRel.target.foodId })
  WITH s, evRel, t
  CALL apoc.util.validate(t IS NULL, 'EVALUATES(FOOD) connect failed: Food not found for foodId %s', [evRel.target.foodId])
  MERGE (s)-[r:EVALUATES]->(t)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    targetKind:       'FOOD',
    role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
    strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
    extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
    validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
    invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ─── FOOD_VARIANT branch (connect-only) ─────────────────────────────────────
  WITH s, evRel
  WITH s, evRel WHERE evRel.target.kind = 'FOOD_VARIANT'
  OPTIONAL MATCH (t:FoodVariant { foodVariantId: evRel.target.foodVariantId })
  WITH s, evRel, t
  CALL apoc.util.validate(t IS NULL, 'EVALUATES(FOOD_VARIANT) connect failed: FoodVariant not found for foodVariantId %s', [evRel.target.foodVariantId])
  MERGE (s)-[r:EVALUATES]->(t)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    targetKind:       'FOOD_VARIANT',
    role:             CASE WHEN evRel.role              IS NULL THEN r.role             ELSE evRel.role             END,
    strength:         CASE WHEN evRel.audit.strength    IS NULL THEN r.strength         ELSE evRel.audit.strength   END,
    extractorVersion: CASE WHEN evRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE evRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN evRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE evRel.audit.extractedAt END,
    validAt:          CASE WHEN evRel.audit.validAt     IS NULL THEN r.validAt          ELSE evRel.audit.validAt    END,
    invalidAt:        CASE WHEN evRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE evRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN evRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE evRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// SPONSORED_BY (Study -> Organization) — create OR connect
// ============================================================================

export const studySponsoredByCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($sponsoredBy, []) AS spRel
CALL {
  // ---- CREATE branch ----
  WITH s, spRel
  WITH s, spRel WHERE spRel.organization.create IS NOT NULL

  MERGE (o:Organization { organizationId: coalesce(spRel.organization.create.organizationId, randomUUID()) })
  ON CREATE SET o.createdAt = datetime()
  SET o += {
    name:    CASE WHEN spRel.organization.create.name    IS NULL THEN o.name    ELSE spRel.organization.create.name    END,
    orgType: CASE WHEN spRel.organization.create.orgType IS NULL THEN o.orgType ELSE spRel.organization.create.orgType END,
    validAt: CASE WHEN spRel.organization.create.validAt IS NULL THEN o.validAt ELSE spRel.organization.create.validAt END,
    invalidAt: CASE WHEN spRel.organization.create.invalidAt IS NULL THEN o.invalidAt ELSE spRel.organization.create.invalidAt END,
    expiredAt: CASE WHEN spRel.organization.create.expiredAt IS NULL THEN o.expiredAt ELSE spRel.organization.create.expiredAt END
  }

  MERGE (s)-[r:SPONSORED_BY]->(o)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN spRel.role              IS NULL THEN r.role             ELSE spRel.role             END,
    strength:         CASE WHEN spRel.audit.strength    IS NULL THEN r.strength         ELSE spRel.audit.strength   END,
    extractorVersion: CASE WHEN spRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE spRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN spRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE spRel.audit.extractedAt END,
    validAt:          CASE WHEN spRel.audit.validAt     IS NULL THEN r.validAt          ELSE spRel.audit.validAt    END,
    invalidAt:        CASE WHEN spRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE spRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN spRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE spRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH s, spRel
  WITH s, spRel WHERE spRel.organization.connect IS NOT NULL
  OPTIONAL MATCH (o:Organization { organizationId: spRel.organization.connect.organizationId })
  WITH s, spRel, o
  CALL apoc.util.validate(o IS NULL, 'SPONSORED_BY connect failed: Organization not found for organizationId %s', [spRel.organization.connect.organizationId])
  MERGE (s)-[r:SPONSORED_BY]->(o)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN spRel.role              IS NULL THEN r.role             ELSE spRel.role             END,
    strength:         CASE WHEN spRel.audit.strength    IS NULL THEN r.strength         ELSE spRel.audit.strength   END,
    extractorVersion: CASE WHEN spRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE spRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN spRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE spRel.audit.extractedAt END,
    validAt:          CASE WHEN spRel.audit.validAt     IS NULL THEN r.validAt          ELSE spRel.audit.validAt    END,
    invalidAt:        CASE WHEN spRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE spRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN spRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE spRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// RUN_BY (Study -> Organization) — create OR connect
// ============================================================================

export const studyRunByCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($runBy, []) AS rbRel
CALL {
  // ---- CREATE branch ----
  WITH s, rbRel
  WITH s, rbRel WHERE rbRel.organization.create IS NOT NULL

  MERGE (o:Organization { organizationId: coalesce(rbRel.organization.create.organizationId, randomUUID()) })
  ON CREATE SET o.createdAt = datetime()
  SET o += {
    name:    CASE WHEN rbRel.organization.create.name    IS NULL THEN o.name    ELSE rbRel.organization.create.name    END,
    orgType: CASE WHEN rbRel.organization.create.orgType IS NULL THEN o.orgType ELSE rbRel.organization.create.orgType END,
    validAt: CASE WHEN rbRel.organization.create.validAt IS NULL THEN o.validAt ELSE rbRel.organization.create.validAt END,
    invalidAt: CASE WHEN rbRel.organization.create.invalidAt IS NULL THEN o.invalidAt ELSE rbRel.organization.create.invalidAt END,
    expiredAt: CASE WHEN rbRel.organization.create.expiredAt IS NULL THEN o.expiredAt ELSE rbRel.organization.create.expiredAt END
  }

  MERGE (s)-[r:RUN_BY]->(o)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN rbRel.role              IS NULL THEN r.role             ELSE rbRel.role             END,
    strength:         CASE WHEN rbRel.audit.strength    IS NULL THEN r.strength         ELSE rbRel.audit.strength   END,
    extractorVersion: CASE WHEN rbRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE rbRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN rbRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE rbRel.audit.extractedAt END,
    validAt:          CASE WHEN rbRel.audit.validAt     IS NULL THEN r.validAt          ELSE rbRel.audit.validAt    END,
    invalidAt:        CASE WHEN rbRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE rbRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN rbRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE rbRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch ----
  WITH s, rbRel
  WITH s, rbRel WHERE rbRel.organization.connect IS NOT NULL
  OPTIONAL MATCH (o:Organization { organizationId: rbRel.organization.connect.organizationId })
  WITH s, rbRel, o
  CALL apoc.util.validate(o IS NULL, 'RUN_BY connect failed: Organization not found for organizationId %s', [rbRel.organization.connect.organizationId])
  MERGE (s)-[r:RUN_BY]->(o)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN rbRel.role              IS NULL THEN r.role             ELSE rbRel.role             END,
    strength:         CASE WHEN rbRel.audit.strength    IS NULL THEN r.strength         ELSE rbRel.audit.strength   END,
    extractorVersion: CASE WHEN rbRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE rbRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN rbRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE rbRel.audit.extractedAt END,
    validAt:          CASE WHEN rbRel.audit.validAt     IS NULL THEN r.validAt          ELSE rbRel.audit.validAt    END,
    invalidAt:        CASE WHEN rbRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE rbRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN rbRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE rbRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// INVESTIGATED_BY (Study -> Person) — create OR connect
// ============================================================================

export const studyInvestigatedByCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($investigatedBy, []) AS ibRel
CALL {
  // ---- CREATE branch ----
  WITH s, ibRel
  WITH s, ibRel WHERE ibRel.person.create IS NOT NULL

  MERGE (p:Person { personId: coalesce(ibRel.person.create.personId, randomUUID()) })
  ON CREATE SET p.createdAt = datetime()
  SET p += {
    canonicalName: CASE WHEN ibRel.person.create.canonicalName IS NULL THEN p.canonicalName ELSE ibRel.person.create.canonicalName END,
    aliases: CASE
      WHEN ibRel.person.create.aliases IS NULL THEN p.aliases
      ELSE apoc.coll.toSet(coalesce(p.aliases, []) + coalesce(ibRel.person.create.aliases, []))
    END,
    validAt:   CASE WHEN ibRel.person.create.validAt   IS NULL THEN p.validAt   ELSE ibRel.person.create.validAt   END,
    invalidAt: CASE WHEN ibRel.person.create.invalidAt IS NULL THEN p.invalidAt ELSE ibRel.person.create.invalidAt END,
    expiredAt: CASE WHEN ibRel.person.create.expiredAt IS NULL THEN p.expiredAt ELSE ibRel.person.create.expiredAt END
  }

  MERGE (s)-[r:INVESTIGATED_BY]->(p)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN ibRel.role              IS NULL THEN r.role             ELSE ibRel.role             END,
    affiliation:      CASE WHEN ibRel.affiliation       IS NULL THEN r.affiliation      ELSE ibRel.affiliation      END,
    strength:         CASE WHEN ibRel.audit.strength    IS NULL THEN r.strength         ELSE ibRel.audit.strength   END,
    extractorVersion: CASE WHEN ibRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE ibRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN ibRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE ibRel.audit.extractedAt END,
    validAt:          CASE WHEN ibRel.audit.validAt     IS NULL THEN r.validAt          ELSE ibRel.audit.validAt    END,
    invalidAt:        CASE WHEN ibRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE ibRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN ibRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE ibRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch ----
  WITH s, ibRel
  WITH s, ibRel WHERE ibRel.person.connect IS NOT NULL
  OPTIONAL MATCH (p:Person { personId: ibRel.person.connect.personId })
  WITH s, ibRel, p
  CALL apoc.util.validate(p IS NULL, 'INVESTIGATED_BY connect failed: Person not found for personId %s', [ibRel.person.connect.personId])
  MERGE (s)-[r:INVESTIGATED_BY]->(p)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN ibRel.role              IS NULL THEN r.role             ELSE ibRel.role             END,
    affiliation:      CASE WHEN ibRel.affiliation       IS NULL THEN r.affiliation      ELSE ibRel.affiliation      END,
    strength:         CASE WHEN ibRel.audit.strength    IS NULL THEN r.strength         ELSE ibRel.audit.strength   END,
    extractorVersion: CASE WHEN ibRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE ibRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN ibRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE ibRel.audit.extractedAt END,
    validAt:          CASE WHEN ibRel.audit.validAt     IS NULL THEN r.validAt          ELSE ibRel.audit.validAt    END,
    invalidAt:        CASE WHEN ibRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE ibRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN ibRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE ibRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// STUDIES_POPULATION (Study -> Population) — create OR connect
// ============================================================================

export const studyStudiesPopulationCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($studiesPopulations, []) AS spopRel
CALL {
  // ---- CREATE branch ----
  WITH s, spopRel
  WITH s, spopRel WHERE spopRel.population.create IS NOT NULL

  MERGE (pop:Population { populationId: coalesce(spopRel.population.create.populationId, randomUUID()) })
  ON CREATE SET pop.createdAt = datetime()
  SET pop += {
    name:           CASE WHEN spopRel.population.create.name           IS NULL THEN pop.name           ELSE spopRel.population.create.name           END,
    populationKind: CASE WHEN spopRel.population.create.populationKind IS NULL THEN pop.populationKind ELSE spopRel.population.create.populationKind END,
    species:        CASE WHEN spopRel.population.create.species        IS NULL THEN pop.species        ELSE spopRel.population.create.species        END,
    strain:         CASE WHEN spopRel.population.create.strain         IS NULL THEN pop.strain         ELSE spopRel.population.create.strain         END,
    cellLine:       CASE WHEN spopRel.population.create.cellLine       IS NULL THEN pop.cellLine       ELSE spopRel.population.create.cellLine       END,
    diseaseState:   CASE WHEN spopRel.population.create.diseaseState   IS NULL THEN pop.diseaseState   ELSE spopRel.population.create.diseaseState   END,
    ageMin:         CASE WHEN spopRel.population.create.ageMin         IS NULL THEN pop.ageMin         ELSE spopRel.population.create.ageMin         END,
    ageMax:         CASE WHEN spopRel.population.create.ageMax         IS NULL THEN pop.ageMax         ELSE spopRel.population.create.ageMax         END,
    ageUnit:        CASE WHEN spopRel.population.create.ageUnit        IS NULL THEN pop.ageUnit        ELSE spopRel.population.create.ageUnit        END,
    sex:            CASE WHEN spopRel.population.create.sex            IS NULL THEN pop.sex            ELSE spopRel.population.create.sex            END,
    n:              CASE WHEN spopRel.population.create.n              IS NULL THEN pop.n              ELSE spopRel.population.create.n              END,
    inclusionCriteria: CASE
      WHEN spopRel.population.create.inclusionCriteria IS NULL THEN pop.inclusionCriteria
      ELSE apoc.coll.toSet(coalesce(pop.inclusionCriteria, []) + coalesce(spopRel.population.create.inclusionCriteria, []))
    END,
    exclusionCriteria: CASE
      WHEN spopRel.population.create.exclusionCriteria IS NULL THEN pop.exclusionCriteria
      ELSE apoc.coll.toSet(coalesce(pop.exclusionCriteria, []) + coalesce(spopRel.population.create.exclusionCriteria, []))
    END,
    validAt:   CASE WHEN spopRel.population.create.validAt   IS NULL THEN pop.validAt   ELSE spopRel.population.create.validAt   END,
    invalidAt: CASE WHEN spopRel.population.create.invalidAt IS NULL THEN pop.invalidAt ELSE spopRel.population.create.invalidAt END,
    expiredAt: CASE WHEN spopRel.population.create.expiredAt IS NULL THEN pop.expiredAt ELSE spopRel.population.create.expiredAt END
  }

  MERGE (s)-[r:STUDIES_POPULATION]->(pop)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN spopRel.role              IS NULL THEN r.role             ELSE spopRel.role             END,
    strength:         CASE WHEN spopRel.audit.strength    IS NULL THEN r.strength         ELSE spopRel.audit.strength   END,
    extractorVersion: CASE WHEN spopRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE spopRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN spopRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE spopRel.audit.extractedAt END,
    validAt:          CASE WHEN spopRel.audit.validAt     IS NULL THEN r.validAt          ELSE spopRel.audit.validAt    END,
    invalidAt:        CASE WHEN spopRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE spopRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN spopRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE spopRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch ----
  WITH s, spopRel
  WITH s, spopRel WHERE spopRel.population.connect IS NOT NULL
  OPTIONAL MATCH (pop:Population { populationId: spopRel.population.connect.populationId })
  WITH s, spopRel, pop
  CALL apoc.util.validate(pop IS NULL, 'STUDIES_POPULATION connect failed: Population not found for populationId %s', [spopRel.population.connect.populationId])
  MERGE (s)-[r:STUDIES_POPULATION]->(pop)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN spopRel.role              IS NULL THEN r.role             ELSE spopRel.role             END,
    strength:         CASE WHEN spopRel.audit.strength    IS NULL THEN r.strength         ELSE spopRel.audit.strength   END,
    extractorVersion: CASE WHEN spopRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE spopRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN spopRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE spopRel.audit.extractedAt END,
    validAt:          CASE WHEN spopRel.audit.validAt     IS NULL THEN r.validAt          ELSE spopRel.audit.validAt    END,
    invalidAt:        CASE WHEN spopRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE spopRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN spopRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE spopRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// HAS_DATASET (Study -> Dataset) — create OR connect
// ============================================================================

export const studyHasDatasetCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($hasDatasets, []) AS dsRel
CALL {
  // ---- CREATE branch ----
  WITH s, dsRel
  WITH s, dsRel WHERE dsRel.dataset.create IS NOT NULL

  MERGE (d:Dataset { datasetId: coalesce(dsRel.dataset.create.datasetId, randomUUID()) })
  ON CREATE SET d.createdAt = datetime()
  SET d += {
    name:         CASE WHEN dsRel.dataset.create.name         IS NULL THEN d.name         ELSE dsRel.dataset.create.name         END,
    description:  CASE WHEN dsRel.dataset.create.description  IS NULL THEN d.description  ELSE dsRel.dataset.create.description  END,
    datasetKind:  CASE WHEN dsRel.dataset.create.datasetKind  IS NULL THEN d.datasetKind  ELSE dsRel.dataset.create.datasetKind  END,
    format:       CASE WHEN dsRel.dataset.create.format       IS NULL THEN d.format       ELSE dsRel.dataset.create.format       END,
    license:      CASE WHEN dsRel.dataset.create.license      IS NULL THEN d.license      ELSE dsRel.dataset.create.license      END,
    accessLevel:  CASE WHEN dsRel.dataset.create.accessLevel  IS NULL THEN d.accessLevel  ELSE dsRel.dataset.create.accessLevel  END,
    sourceSystem: CASE WHEN dsRel.dataset.create.sourceSystem IS NULL THEN d.sourceSystem ELSE dsRel.dataset.create.sourceSystem END,
    uri:          CASE WHEN dsRel.dataset.create.uri          IS NULL THEN d.uri          ELSE dsRel.dataset.create.uri          END,
    checksum:     CASE WHEN dsRel.dataset.create.checksum     IS NULL THEN d.checksum     ELSE dsRel.dataset.create.checksum     END,
    version:      CASE WHEN dsRel.dataset.create.version      IS NULL THEN d.version      ELSE dsRel.dataset.create.version      END,
    publishedAt:  CASE WHEN dsRel.dataset.create.publishedAt  IS NULL THEN d.publishedAt  ELSE dsRel.dataset.create.publishedAt  END,
    validAt:      CASE WHEN dsRel.dataset.create.validAt      IS NULL THEN d.validAt      ELSE dsRel.dataset.create.validAt      END,
    invalidAt:    CASE WHEN dsRel.dataset.create.invalidAt    IS NULL THEN d.invalidAt    ELSE dsRel.dataset.create.invalidAt    END,
    expiredAt:    CASE WHEN dsRel.dataset.create.expiredAt    IS NULL THEN d.expiredAt    ELSE dsRel.dataset.create.expiredAt    END
  }

  MERGE (s)-[r:HAS_DATASET]->(d)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN dsRel.role              IS NULL THEN r.role             ELSE dsRel.role             END,
    accessNotes:      CASE WHEN dsRel.accessNotes       IS NULL THEN r.accessNotes      ELSE dsRel.accessNotes      END,
    strength:         CASE WHEN dsRel.audit.strength    IS NULL THEN r.strength         ELSE dsRel.audit.strength   END,
    extractorVersion: CASE WHEN dsRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE dsRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN dsRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE dsRel.audit.extractedAt END,
    validAt:          CASE WHEN dsRel.audit.validAt     IS NULL THEN r.validAt          ELSE dsRel.audit.validAt    END,
    invalidAt:        CASE WHEN dsRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE dsRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN dsRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE dsRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch ----
  WITH s, dsRel
  WITH s, dsRel WHERE dsRel.dataset.connect IS NOT NULL
  OPTIONAL MATCH (d:Dataset { datasetId: dsRel.dataset.connect.datasetId })
  WITH s, dsRel, d
  CALL apoc.util.validate(d IS NULL, 'HAS_DATASET connect failed: Dataset not found for datasetId %s', [dsRel.dataset.connect.datasetId])
  MERGE (s)-[r:HAS_DATASET]->(d)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN dsRel.role              IS NULL THEN r.role             ELSE dsRel.role             END,
    accessNotes:      CASE WHEN dsRel.accessNotes       IS NULL THEN r.accessNotes      ELSE dsRel.accessNotes      END,
    strength:         CASE WHEN dsRel.audit.strength    IS NULL THEN r.strength         ELSE dsRel.audit.strength   END,
    extractorVersion: CASE WHEN dsRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE dsRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN dsRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE dsRel.audit.extractedAt END,
    validAt:          CASE WHEN dsRel.audit.validAt     IS NULL THEN r.validAt          ELSE dsRel.audit.validAt    END,
    invalidAt:        CASE WHEN dsRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE dsRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN dsRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE dsRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// INVESTIGATES_CONDITION (Study -> Condition) — create OR connect
// ============================================================================

export const studyInvestigatesConditionCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($investigatesConditions, []) AS icRel
CALL {
  // ---- CREATE branch ----
  WITH s, icRel
  WITH s, icRel WHERE icRel.condition.create IS NOT NULL

  MERGE (c:Condition { conditionId: coalesce(icRel.condition.create.conditionId, randomUUID()) })
  ON CREATE SET c.createdAt = datetime()
  SET c += {
    name:        CASE WHEN icRel.condition.create.name        IS NULL THEN c.name        ELSE icRel.condition.create.name        END,
    description: CASE WHEN icRel.condition.create.description IS NULL THEN c.description ELSE icRel.condition.create.description END,
    aliases: CASE
      WHEN icRel.condition.create.aliases IS NULL THEN c.aliases
      ELSE apoc.coll.toSet(coalesce(c.aliases, []) + coalesce(icRel.condition.create.aliases, []))
    END,
    icdCodes: CASE
      WHEN icRel.condition.create.icdCodes IS NULL THEN c.icdCodes
      ELSE apoc.coll.toSet(coalesce(c.icdCodes, []) + coalesce(icRel.condition.create.icdCodes, []))
    END,
    snomedCodes: CASE
      WHEN icRel.condition.create.snomedCodes IS NULL THEN c.snomedCodes
      ELSE apoc.coll.toSet(coalesce(c.snomedCodes, []) + coalesce(icRel.condition.create.snomedCodes, []))
    END,
    meshTerms: CASE
      WHEN icRel.condition.create.meshTerms IS NULL THEN c.meshTerms
      ELSE apoc.coll.toSet(coalesce(c.meshTerms, []) + coalesce(icRel.condition.create.meshTerms, []))
    END,
    validAt:   CASE WHEN icRel.condition.create.validAt   IS NULL THEN c.validAt   ELSE icRel.condition.create.validAt   END,
    invalidAt: CASE WHEN icRel.condition.create.invalidAt IS NULL THEN c.invalidAt ELSE icRel.condition.create.invalidAt END,
    expiredAt: CASE WHEN icRel.condition.create.expiredAt IS NULL THEN c.expiredAt ELSE icRel.condition.create.expiredAt END
  }

  MERGE (s)-[r:INVESTIGATES_CONDITION]->(c)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN icRel.role              IS NULL THEN r.role             ELSE icRel.role             END,
    strength:         CASE WHEN icRel.audit.strength    IS NULL THEN r.strength         ELSE icRel.audit.strength   END,
    extractorVersion: CASE WHEN icRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE icRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN icRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE icRel.audit.extractedAt END,
    validAt:          CASE WHEN icRel.audit.validAt     IS NULL THEN r.validAt          ELSE icRel.audit.validAt    END,
    invalidAt:        CASE WHEN icRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE icRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN icRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE icRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch ----
  WITH s, icRel
  WITH s, icRel WHERE icRel.condition.connect IS NOT NULL
  OPTIONAL MATCH (c:Condition { conditionId: icRel.condition.connect.conditionId })
  WITH s, icRel, c
  CALL apoc.util.validate(c IS NULL, 'INVESTIGATES_CONDITION connect failed: Condition not found for conditionId %s', [icRel.condition.connect.conditionId])
  MERGE (s)-[r:INVESTIGATES_CONDITION]->(c)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    role:             CASE WHEN icRel.role              IS NULL THEN r.role             ELSE icRel.role             END,
    strength:         CASE WHEN icRel.audit.strength    IS NULL THEN r.strength         ELSE icRel.audit.strength   END,
    extractorVersion: CASE WHEN icRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE icRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN icRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE icRel.audit.extractedAt END,
    validAt:          CASE WHEN icRel.audit.validAt     IS NULL THEN r.validAt          ELSE icRel.audit.validAt    END,
    invalidAt:        CASE WHEN icRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE icRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN icRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE icRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// HAS_OUTCOME (Study -> StudyOutcome) — create OR connect
// ============================================================================

export const studyHasOutcomeCypher = `
MATCH (s:Study { studyId: $studyId })

UNWIND coalesce($hasOutcomes, []) AS hoRel
CALL {
  // ---- CREATE branch ----
  WITH s, hoRel
  WITH s, hoRel WHERE hoRel.outcome.create IS NOT NULL

  MERGE (so:StudyOutcome { studyOutcomeId: coalesce(hoRel.outcome.create.studyOutcomeId, randomUUID()) })
  ON CREATE SET so.createdAt = datetime()
  SET so += {
    canonicalName:   CASE WHEN hoRel.outcome.create.canonicalName   IS NULL THEN so.canonicalName   ELSE hoRel.outcome.create.canonicalName   END,
    displayName:     CASE WHEN hoRel.outcome.create.displayName     IS NULL THEN so.displayName     ELSE hoRel.outcome.create.displayName     END,
    description:     CASE WHEN hoRel.outcome.create.description     IS NULL THEN so.description     ELSE hoRel.outcome.create.description     END,
    outcomeCategory: CASE WHEN hoRel.outcome.create.outcomeCategory IS NULL THEN so.outcomeCategory ELSE hoRel.outcome.create.outcomeCategory END,
    polarityHint:    CASE WHEN hoRel.outcome.create.polarityHint    IS NULL THEN so.polarityHint    ELSE hoRel.outcome.create.polarityHint    END,
    domain:          CASE WHEN hoRel.outcome.create.domain          IS NULL THEN so.domain          ELSE hoRel.outcome.create.domain          END,
    measurementType: CASE WHEN hoRel.outcome.create.measurementType IS NULL THEN so.measurementType ELSE hoRel.outcome.create.measurementType END,
    unit:            CASE WHEN hoRel.outcome.create.unit            IS NULL THEN so.unit            ELSE hoRel.outcome.create.unit            END,
    biologicalMatrix: CASE WHEN hoRel.outcome.create.biologicalMatrix IS NULL THEN so.biologicalMatrix ELSE hoRel.outcome.create.biologicalMatrix END,
    analyte:         CASE WHEN hoRel.outcome.create.analyte         IS NULL THEN so.analyte         ELSE hoRel.outcome.create.analyte         END,
    timeHorizon:     CASE WHEN hoRel.outcome.create.timeHorizon     IS NULL THEN so.timeHorizon     ELSE hoRel.outcome.create.timeHorizon     END,
    standardSystem:  CASE WHEN hoRel.outcome.create.standardSystem  IS NULL THEN so.standardSystem  ELSE hoRel.outcome.create.standardSystem  END,
    standardCode:    CASE WHEN hoRel.outcome.create.standardCode    IS NULL THEN so.standardCode    ELSE hoRel.outcome.create.standardCode    END,
    standardLabel:   CASE WHEN hoRel.outcome.create.standardLabel   IS NULL THEN so.standardLabel   ELSE hoRel.outcome.create.standardLabel   END,
    aliases: CASE
      WHEN hoRel.outcome.create.aliases IS NULL THEN so.aliases
      ELSE apoc.coll.toSet(coalesce(so.aliases, []) + coalesce(hoRel.outcome.create.aliases, []))
    END,
    validAt:   CASE WHEN hoRel.outcome.create.validAt   IS NULL THEN so.validAt   ELSE hoRel.outcome.create.validAt   END,
    invalidAt: CASE WHEN hoRel.outcome.create.invalidAt IS NULL THEN so.invalidAt ELSE hoRel.outcome.create.invalidAt END,
    expiredAt: CASE WHEN hoRel.outcome.create.expiredAt IS NULL THEN so.expiredAt ELSE hoRel.outcome.create.expiredAt END
  }

  MERGE (s)-[r:HAS_OUTCOME]->(so)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    priority:         CASE WHEN hoRel.priority         IS NULL THEN r.priority         ELSE hoRel.priority         END,
    role:             CASE WHEN hoRel.role              IS NULL THEN r.role             ELSE hoRel.role             END,
    strength:         CASE WHEN hoRel.audit.strength    IS NULL THEN r.strength         ELSE hoRel.audit.strength   END,
    extractorVersion: CASE WHEN hoRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE hoRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN hoRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE hoRel.audit.extractedAt END,
    validAt:          CASE WHEN hoRel.audit.validAt     IS NULL THEN r.validAt          ELSE hoRel.audit.validAt    END,
    invalidAt:        CASE WHEN hoRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE hoRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN hoRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE hoRel.audit.expiredAt  END
  }
  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch ----
  WITH s, hoRel
  WITH s, hoRel WHERE hoRel.outcome.connect IS NOT NULL
  OPTIONAL MATCH (so:StudyOutcome { studyOutcomeId: hoRel.outcome.connect.studyOutcomeId })
  WITH s, hoRel, so
  CALL apoc.util.validate(so IS NULL, 'HAS_OUTCOME connect failed: StudyOutcome not found for studyOutcomeId %s', [hoRel.outcome.connect.studyOutcomeId])
  MERGE (s)-[r:HAS_OUTCOME]->(so)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    priority:         CASE WHEN hoRel.priority         IS NULL THEN r.priority         ELSE hoRel.priority         END,
    role:             CASE WHEN hoRel.role              IS NULL THEN r.role             ELSE hoRel.role             END,
    strength:         CASE WHEN hoRel.audit.strength    IS NULL THEN r.strength         ELSE hoRel.audit.strength   END,
    extractorVersion: CASE WHEN hoRel.audit.extractorVersion IS NULL THEN r.extractorVersion ELSE hoRel.audit.extractorVersion END,
    extractedAt:      CASE WHEN hoRel.audit.extractedAt IS NULL THEN r.extractedAt     ELSE hoRel.audit.extractedAt END,
    validAt:          CASE WHEN hoRel.audit.validAt     IS NULL THEN r.validAt          ELSE hoRel.audit.validAt    END,
    invalidAt:        CASE WHEN hoRel.audit.invalidAt   IS NULL THEN r.invalidAt        ELSE hoRel.audit.invalidAt  END,
    expiredAt:        CASE WHEN hoRel.audit.expiredAt   IS NULL THEN r.expiredAt        ELSE hoRel.audit.expiredAt  END
  }
  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ============================================================================
// Return Study
// ============================================================================

export const returnStudyCypher = `
MATCH (s:Study { studyId: $studyId })
RETURN s
`;

// ============================================================================
// Named export bundle
// ============================================================================

export const upsertStudyStatements = {
  studyEvaluatesCypher,
  studySponsoredByCypher,
  studyRunByCypher,
  studyInvestigatedByCypher,
  studyStudiesPopulationCypher,
  studyHasDatasetCypher,
  studyInvestigatesConditionCypher,
  studyHasOutcomeCypher,
  returnStudyCypher,
};
