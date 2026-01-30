Neo4j Write Pattern Directive (Zod → Params → Single TX → Optional Relations)
Purpose

Implement create<Model>WithOptionalRelations and update<Model>WithOptionalRelations in a way that is:

Atomic: all writes happen inside one Neo4j write transaction (executeWrite)

Predictable: relationship arrays are processed only if provided

Strict: connect and update fail loudly if targets/relationships don’t exist

Schema-driven: Zod input controls which statements run

APOC-consistent: validation + set semantics are done via APOC helpers

1) Service Function Structure (Required)
1.1 Always validate input first (Zod)

Use validateInput(<Schema>, input, <Name>)

Never touch Neo4j with unvalidated input

Rule

Validation produces validated, which is the only source of truth for writes.

1.2 Build a params object with strict shaping rules

Scalar fields

Convert optional scalars to explicit null:

field: validated.field ?? null

This enables consistent Cypher patterns:

CASE WHEN $field IS NULL THEN existing ELSE $field END

Relationship arrays

Relationship arrays MUST always be arrays, never null:

relArray: validated.relArray ?? []

This ensures predictable UNWIND $relArray AS rel.

Directive

“Keep params as primitives/arrays; each tx.run block plucks what it needs.”

1.3 Use one executeWrite call with multiple sequential tx.run blocks

All create/update steps must occur within:

return executeWrite(async (tx) => {
  // 0) base node write
  // 1..N) relationship writes conditionally
  // final) return node
});


Rule

Each relationship type gets its own tx.run(cypher, params) statement.

Do not attempt “giant monolithic cypher” for the entire write.

1.4 Conditionals decide what to run

Only run relationship statements when the corresponding array has items:

if (params.offersProduct.length) {
  await tx.run(statements.offersProductCypher, params);
}


Rule

Never run a relationship statement if its array is empty.

Avoid UNWIND [] blocks unless you explicitly need them.

1.5 Always return final node at end

After all writes:

Run a final MATCH/RETURN query to return the node

Use firstRecordOrNull

Return node.properties ?? node

2) Cypher Statement Rules (Required)

Each relationship statement follows a strict template:

2.1 Base relationship statement template

MATCH (root:Label {id: $id})

UNWIND $relationshipArray AS rel

CALL { … UNION … UNION … }

RETURN count(*) AS _processed

2.2 Use CALL {} with three mutually exclusive branches

Each relationship supports up to 3 behaviors:

CREATE: create/update target node and MERGE relationship

CONNECT (strict): target node must already exist

UPDATE (strict): target node AND relationship must already exist

Each branch MUST begin like this:

WITH root, rel
WITH root, rel WHERE rel.<targetField>.<mode> IS NOT NULL


Rule

Always use two WITH lines:

First: importing WITH root, rel

Second: WITH root, rel WHERE ...

Do not put WHERE on the first WITH.

2.3 Strict semantics via apoc.util.validate

Use APOC validation to enforce correctness.

Base node existence (update root)

OPTIONAL MATCH (o:Organization {organizationId: $organizationId})
CALL apoc.util.validate(
  o IS NULL,
  'updateOrganization failed: Organization not found for organizationId %s',
  [$organizationId]
)


CONNECT branch strictness

Must fail if the target node does not exist:

OPTIONAL MATCH (p2:Product {productId: rel.product.connect.productId})
CALL apoc.util.validate(
  p2 IS NULL,
  '... connect failed: Product not found for productId %s',
  [rel.product.connect.productId]
)


UPDATE branch strictness

Must fail if:

required id is missing

target node missing

relationship missing

CALL apoc.util.validate(
  rel.product.update.productId IS NULL,
  '... update failed: product.update.productId is required',
  []
)

OPTIONAL MATCH (p3:Product {productId: rel.product.update.productId})
OPTIONAL MATCH (o)-[r3:REL_TYPE]->(p3)

CALL apoc.util.validate(p3 IS NULL, '... target not found ...', [...])
CALL apoc.util.validate(r3 IS NULL, '... relationship not found ...', [...])


Rule

UPDATE must never create missing relationships. It only updates existing ones.

2.4 MERGE + createdAt conventions

When creating:

Target node: MERGE (t:Label {id: coalesce(inputId, randomUUID())})

ON CREATE SET t.createdAt = datetime()

Relationship: MERGE (root)-[r:TYPE]->(t)

ON CREATE SET r.createdAt = datetime()

2.5 Scalar update semantics (null means “no change”)

All SET blocks must follow:

field: CASE WHEN input IS NULL THEN existing.field ELSE input END

2.6 Array “append unique” semantics via APOC

For array properties where you want additive updates:

apoc.coll.toSet(coalesce(existingArray, []) + coalesce(incomingArray, []))


Rule

Prefer additive-merge semantics for tags/aliases/claimIds.

Prefer overwrite semantics only when explicitly intended.

2.7 Return sentinel columns from subquery branches

Each subquery branch returns 1 AS okX (or similar).

Rule

All UNION branches must return the same columns.

The enclosing statement should return count(*) AS _<rel>Processed to aid debugging.

3) Zod Input → Cypher Semantics (Required)
3.1 Relationship input shape enforces exclusivity

Relate/update inputs must enforce “exactly one of create/connect/update” in Zod (as you already do).

Directive

The service layer assumes the Zod schema has already enforced exclusivity.

Cypher branches can safely key off rel.target.create/connect/update IS NOT NULL.

3.2 Service layer conditional execution is based on arrays, not nested fields

Service checks only: params.relArray.length

Cypher checks create/connect/update per-element.

Rule

Don’t pre-filter relationship elements in TypeScript.

Keep logic in Cypher for consistency and single source of truth.

4) Create vs Update Service Rules
4.1 Create flow

Upsert root node (MERGE) and return something to confirm success

For each relationship array with length:

run the relationship cypher

Return root node at end

4.2 Update flow

Validate root exists (apoc.util.validate(o IS NULL, ...))

Update scalar fields with null-means-no-change semantics

For each relationship array with length:

run the relationship update cypher (supports create/connect/update branches)

Return root node at end

5) Guardrails (Non-Negotiable)

Single transaction per request: all writes for a create/update happen in one executeWrite.

No deep recursion: nested create/update is allowed only as explicitly encoded in relationship Cypher.

Strict UPDATE: never creates missing nodes/relationships; must validate existence.

No null relationship arrays: always pass [].

APOC validation everywhere it matters:

root existence (update)

connect target existence

update requires id + node existence + relationship existence

Return final read after writes: do not rely on intermediate results.