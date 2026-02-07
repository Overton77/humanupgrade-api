# Document Ingestion Plan (MVP): Unstructured → Structured into Neo4j via GraphQL

## Purpose

This document defines the minimal, precise architecture for ingesting unstructured sources (synthetic case studies today; later transcripts, etc.) into Neo4j using:

- **Python ingestion pipeline**: performs all compute (LLM + embeddings + extraction + routing)
- **TypeScript GraphQL API**: performs only persistence (validation + idempotent upserts + invariants + batching + provenance stamping)

The goal is to run an end-to-end ingest today and validate retrieval with a simple RAG query.

## Core Principle: Strict Separation of Concerns

### Ingestion System (Python) does:

- summarization (optional)
- chunking
- embeddings
- entity extraction (LLM structured output)
- entity routing (choose which service resolver to call)
- edge extraction (LLM structured output)
- smart dedup (aliases, fuzzy linking decisions)
- prepares batched GraphQL mutation payloads
- validates embedding dims prior to writing

### GraphQL API (TypeScript) does not:

- chunk text
- call embedding models
- run LLM prompts
- attempt fuzzy dedup / semantic matching

### GraphQL API does:

- validate input shapes (types, required fields, enums)
- idempotent upserts using deterministic keys
- batch writes using UNWIND
- enforce invariants (uniqueness, relationship structure)
- stamp provenance/validity metadata on nodes + relationships
- store embeddings directly on `Chunk.embedding` (Neo4j vector index)

## Data Model (MVP Types We Create Today)

### Nodes

- `Document`
- `DocumentTextVersion`
- `Segmentation`
- `Chunk` (with embedding vector stored on node)
- `ResearchRunRef` / `ResearchPlanRef`
- Structured nodes (`Product`/`Organization`/etc.) via your existing service upserts (or fallback generic if needed)

### Relationships

#### Lineage / Retrieval Backbone

```cypher
(Document)-[:HAS_TEXT_VERSION]->(DocumentTextVersion)
(DocumentTextVersion)-[:HAS_SEGMENTATION]->(Segmentation)
(Segmentation)-[:HAS_CHUNK]->(Chunk)
(Document)-[:HAS_CHUNK]->(Chunk) ✅ required for fast doc→chunks
(Chunk)-[:NEXT_CHUNK]->(Chunk) ✅ optional but recommended
```

#### Evidence links (canonical)

```cypher
(Chunk)-[:ABOUT]->(StructuredNode)
(Chunk)-[:MENTIONS]->(StructuredNode)
```

#### Provenance

```cypher
(ResearchRunRef)-[:USES_PLAN]->(ResearchPlanRef)
```

**Optional** (today you can choose either):

- stamp `mongoRunId`/`mongoPlanId`/`stageKey`/... directly on evidence relationships, or
- `(Node)-[:GENERATED_BY]->(ResearchRunRef)` (good for reverse queries)

## Deterministic Keys and Idempotency

> **What the ingestion system must compute**

These are computed in Python and sent in the mutation inputs.

### Document keys

- `documentKey`: canonical URL or `externalId`, else content fingerprint fallback

### Text + segmentation keys

- `textVersionHash`: `SHA256(full text)`
- `segmentationHash`: `hash(strategy + params + textVersionHash)`

### Chunk keys

```javascript
chunkKey = `${textVersionHash}:${segmentationHash}:${index}`
```

### Relationship keys (API-level idempotency)

For evidence edges, API merges by a deterministic `relKey`:

```javascript
relKey = `${sourceId}|${RELTYPE}|${targetId}|${mongoRunId}|${stageKey}`
```

This allows safe re-runs.

## Responsibilities in Detail

### A) Python Ingestion Pipeline (`/ingestion`)

#### A1) Provenance setup (first call of the run)

Choose synthetic IDs:

```python
mongoRunId = "run_synth_..."
mongoPlanId = "plan_synth_..."
```

Call:

- `upsertResearchRunRef(mongoRunId, ...)`
- `upsertResearchPlanRef(mongoPlanId, ...)`
- link run to plan (`USES_PLAN`) if exposed

**Output**: provenance spine exists for stamping.

#### A2) Document upsert (raw)

- Build `DocumentUpsertInput`
- Call `upsertDocument()` → returns `documentId`
- Store `documentId` in memory for later edge extraction.

#### A3) Optional summarization + summary Document

If summary enabled:

- summarize raw text using LLM
- `upsertDocument(summary)` → `summaryDocumentId`
- link summary → raw (use a dedicated relationship if you have it; otherwise a typed evidence edge with a property `relation="SUMMARIZES"`)

#### A4) Chunk + embed + bundle upsert (summary + raw)

For each document text you ingest (summary and raw):

- chunk locally
- embed locally
- validate embedding dims match your Neo4j vector index config
- send a single mutation:

```graphql
upsertDocumentTextVersionBundle(documentId, textVersion, segmentation, chunks[])
```

each `ChunkInput` includes:

- `chunkKey`, `index`, `text`, `offsets`
- `embedding`, `embeddingModel`, `embeddingVersion`

**Output**: chunk IDs returned (critical for the next phase).

#### A5) Entity extraction + routing (typed service upserts)

This is your "entity routing" stage (you said you have this down).

**Input to LLM:**

- chunk texts (or selected chunk subset)
- schema constraints / allowed labels

**LLM output:**

- entities with route fields indicating which service mutation to call
- minimal properties + `naturalKey`

**Pipeline then:**

- calls `upsertProduct`, `upsertOrganization`, etc. (your existing resolvers)
- builds a registry:

```python
entityRegistry = {
    tempKey -> {label, id, naturalKey, displayName}
}
```

**Output**: all structured entities have concrete Neo4j IDs.

#### A6) Evidence edge extraction (separate step; uses real IDs)

> **This is the key "past this point" improvement:**

Run edge extraction **AFTER** entities are upserted.

**Provide the edge-extraction prompt:**

- `documentId`
- `chunks: [{chunkId, index, text}]`
- `entityRegistry: [{label, id, displayName, aliases?}]`
- allowed edge types: `ABOUT`, `MENTIONS` (plus `WRITTEN_BY` if you want)

**LLM returns:**

- `edges[]` already in your `EvidenceEdgeInput` shape (minus provenance timestamps)
- ideally target uses `{label, id}` not `naturalKey`

**Pipeline then:**

- attaches provenance to each edge (do not rely on model for timestamps)
- validates:
  - source ids are valid chunk ids / document id
  - target ids are valid entity ids from registry
- calls:

```graphql
upsertEvidenceEdges(edges[])
```

This yields canonical:

```cypher
Chunk -[:ABOUT|MENTIONS]-> Entity
```

> **Note**: Document-level `ABOUT`/`MENTIONS` is allowed but should be used sparingly (or derived later).

### B) GraphQL API (`/api`)

#### B1) Core invariants (idempotent persistence)

**MERGE rules:**

| Node Type | MERGE Key |
|-----------|-----------|
| `Document` | `documentKey` |
| `TextVersion` | `textVersionHash` (or by `(documentId, textVersionHash)` if you want) |
| `Segmentation` | `segmentationHash` |
| `Chunk` | `chunkKey` |
| Evidence edges | deterministic `relKey` |
| Structured nodes | handled by your existing typed service resolvers (MERGE by `naturalKey` or their own uniqueness rules) |

#### B2) Bundle write is one transaction

`upsertDocumentTextVersionBundle` must:

- MERGE `tv`, `segmentation`, `chunks` (via `UNWIND`)
- create structure edges:
  - `HAS_TEXT_VERSION`, `HAS_SEGMENTATION`, `HAS_CHUNK`
- create retrieval backbone:
  - `Document-HAS_CHUNK`
- optionally create `NEXT_CHUNK` edges

#### B3) Evidence edges grouped by relationship type

Since Neo4j can't parameterize rel types cleanly:

- group edges by type in resolver
- run one `UNWIND` query per type:
  - `:ABOUT`, `:MENTIONS`, etc.

#### B4) Provenance stamping

GraphQL API stamps:

- temporal validity fields on nodes/edges
- run/plan/stage metadata on edges (or creates `GENERATED_BY` edges if you enable that)

> **No fuzzy dedup.**

## End-to-End Data Flow (the exact sequence for today)

### Phase 1 — Provenance spine

1. `upsertResearchPlanRef(plan)`
2. `upsertResearchRunRef(run)`
3. link run→plan (`USES_PLAN`)

### Phase 2 — Documents

1. `upsertDocument(raw)` → `rawDocumentId`
2. summarize (LLM)
3. `upsertDocument(summary)` → `summaryDocumentId`
4. link summary → raw

### Phase 3 — Bundles (chunk + embed + store vectors on chunks)

1. `chunk+embed summary` → `upsertDocumentTextVersionBundle(summaryDocumentId, ...)` → returns `summaryChunkIds`
2. `chunk+embed raw` → `upsertDocumentTextVersionBundle(rawDocumentId, ...)` → returns `rawChunkIds`

### Phase 4 — Structured entities (typed service upserts)

1. entity extraction + routing (LLM)
2. call your service upserts → returns concrete entity IDs

### Phase 5 — Evidence edges (LLM produces drop-in edge inputs)

1. edge extraction (LLM) given:
   - `chunkIds` + chunk text
   - `documentId`
   - entity IDs
2. validate edges
3. `upsertEvidenceEdges(edges[])`

### Phase 6 — Test

1. vector search in Neo4j (`Chunk.embedding`)
2. expand:
   - `chunk` → `ABOUT`/`MENTIONS` → entities
   - `chunk` → `Document` via `HAS_CHUNK`
3. simple RAG answer

## What the GraphQL API Receives (MVP payloads)

### 1) DocumentUpsertInput

- metadata only (no compute)
- provenance required

### 2) upsertDocumentTextVersionBundle

includes chunks with embeddings already computed:

```typescript
ChunkInput.embedding: float[]
```

### 3) Structured nodes

- handled by your typed service resolvers
- (optional fallback) `upsertStructuredNodes` only for long-tail labels

### 4) Evidence edges

**canonical form:**

- `source` = `Chunk` or `Document` (usually `Chunk`)
- `target` = entity by `id` (preferred) or `naturalKey` (fallback)
- properties depend on edge type

## Key Design Decisions (MVP)

### Embeddings stored on Chunk nodes

- required for Neo4j vector indexes
- written during bundle upsert in one transaction

### Chunk-level evidence is canonical

- accountable unit of grounding
- Document-level `ABOUT`/`MENTIONS` can be derived later

### Typed service upserts for structured nodes

- ingestion routes to your existing resolvers (`Product`/`Org`/etc.)
- keeps ontology logic centralized and consistent

### Edge extraction runs AFTER entity upserts

- LLM can output `target.id` reliably
- `upsertEvidenceEdges()` becomes a drop-in write

### Idempotency via deterministic keys everywhere

- safe reruns are a feature, not an accident

## Mutation Set for Today (Minimal)

### Required:

- `upsertResearchRunRef`
- `upsertResearchPlanRef`
- link run→plan (or store `planId` on `runRef`)
- `upsertDocument`
- `upsertDocumentTextVersionBundle`
- typed structured upserts (existing)
- `upsertEvidenceEdges`

### Optional:

- `attachGeneratedBy` (if you want node-level generated-by queries today)
