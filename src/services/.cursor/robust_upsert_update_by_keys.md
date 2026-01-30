Directive: Unique Constraints, Canonical IDs, and Robust Upsert/Update by Alternate Keys
Purpose

Create a robust, ingestion-friendly persistence layer that supports:

Idempotent upserts (repeat ingestion safely)

Flexible updates (update by modelId or alternate unique keys)

Stable relationship writes (always use canonical modelId downstream)

Strict correctness (no ambiguous matches, no silent duplication)

This is achieved by:

defining precise unique constraints

implementing keyed upsert/update that resolves and returns a canonical modelId

normalizing downstream relationship statements to always use modelId

1) Unique Constraints and Key Strategy (Required)
1.1 Canonical ID (Surrogate Key)

Every node label MUST have a canonical internal identifier:

Organization → organizationId

Product → productId

CompoundForm → compoundFormId

etc.

Rule

Canonical IDs are required, stable, and used for:

all downstream relationship statements

all return queries

all API-to-DB internal linkage

Constraint

Add a uniqueness constraint for the canonical ID:

(:Label {<modelId>}) must be unique.

1.2 Alternate Unique Keys (Natural Keys)

Some models MAY have alternate identifiers (ingestion-friendly, external IDs):

Organization: legalName, publicTicker

Product: (example) gtin, ndcCode, upc, etc. (choose intentionally)

Others as appropriate

Rule

Alternate keys are only used for:

lookup

idempotent upsert

update targeting

Constraints

Each alternate key that is used for targeting MUST have a uniqueness constraint.

Alternate keys should be normalized (trim, consistent casing) before persistence.

1.3 Null and Empty Handling

Rule

In the service layer:

convert empty strings to null

alternate keys should not be stored as ""

Unique constraints on null are acceptable; do not store empty strings.

2) Upsert / Update by Identifier (Required)
2.1 Identify-by-One-Of

For create/upsert and update operations, the resolver/service must accept one of:

canonical id: <modelId>

or an alternate unique key: legalName, publicTicker, etc.

Rule

The resolver MUST enforce “exactly one identifier is provided” (or a strict priority rule).

The database write must fail if no identifier is provided.

2.2 Safe Query Construction

Rule

Never interpolate user values into Cypher.

Only interpolate whitelisted property keys (e.g., "organizationId" | "legalName" | "publicTicker").

Always pass identifier values via parameters ($idValue).

3) Canonical ID Guarantee (Non-Negotiable)
3.1 Canonical ID Must Always Exist After Any Upsert/Update

Every upsert/update statement MUST guarantee:

SET o.<modelId> = coalesce(o.<modelId>, randomUUID())


Placement

This must be its own SET statement (not inside SET o += { ... }).

It must occur immediately after MERGE (upsert) or after a successful MATCH+validate (update).

3.2 Canonical ID Must Be Returned

All upsert/update queries MUST RETURN o (or at least return o.<modelId>).

4) Canonical ID Normalization in Service Layer (Required)

After the initial upsert/update query runs, the service MUST:

extract the returned node

read resolvedModelId = o.properties.<modelId>

overwrite params:

params.<modelId> = resolvedModelId

use the updated params for:

all downstream relationship statements

final return query

Rule

Downstream statements MUST NOT rely on alternate keys.

Downstream statements MUST always match by canonical <modelId>.

Example pattern:

const rec = firstRecordOrNull(res);
const node = rec.get("o");
const resolvedId = node.properties.organizationId;

const nextParams = { ...params, organizationId: resolvedId };

// all relationship writes use nextParams
// final return uses nextParams

5) Create/Upsert Semantics (Required)
5.1 Upsert is Idempotent by Identifier

Upsert must MERGE using the selected identifier key (canonical or alternate).

If matched, it updates fields using “null means no change” semantics.

If created, it sets createdAt and generates canonical id if missing.

Rule

Never MERGE with a nullable identifier. If identifier is absent, fail fast.

6) Update Semantics (Required)
6.1 Update Must Be Strict

Update must MATCH by chosen identifier.

Must throw if not found:

apoc.util.validate(o IS NULL, ...)

Must still guarantee canonical id exists via coalesce.

Must not create a new node.

6.2 Identifier Conflicts Must Fail

If multiple identifiers are provided (or if resolver allows multiple):

the DB logic must ensure only one node is matched

if conflicting identifiers match different nodes → fail

Preferred rule:

enforce exactly one identifier at resolver level.

7) Final Read / Selection Semantics (Required)
7.1 Always Return by Canonical ID

All final RETURN queries must match by canonical id:

MATCH (o:Organization {organizationId: $organizationId})
RETURN o


Rule

The service must ensure $organizationId is set in params before this query runs.

8) Why This Exists (Guarantees)

This directive guarantees:

Idempotent ingestion: repeated upsert by legalName/publicTicker hits the same node

No relationship breakage: downstream always uses stable modelId

Flexibility: create/update can target by natural keys or canonical id

Robustness: strict validation prevents ambiguous updates and accidental duplication

Consistency: every entity always ends the transaction with a canonical id