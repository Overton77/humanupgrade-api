Upsert docs + chunks first (so you have real documentId and chunkIds)

Run edge extraction as a dedicated step that is only about producing EvidenceEdgeInput objects that your API can ingest without extra interpretation

Then call upsertEvidenceEdges() (batched, idempotent)

You can do it in one prompt (pass chunkIds and entity IDs/naturalKeys), but in practice it’s more reliable as two sequential steps:

Step A: entity routing + upserts → returns entity IDs

Step B: evidence-edge creation → uses those IDs + chunkIds/documentId

That eliminates “LLM guessed the wrong naturalKey” issues.

Recommended design: evidence edges extraction runs AFTER entity upserts
Why sequential is better

The model doesn’t need to “invent” IDs.

You avoid ambiguity when multiple extracted nodes could map to one canonical entity.

Your edge write becomes a simple “apply this list”.

So your pipeline becomes:

Upsert Document(s) + bundle(s) → get documentId, chunkMetas[]

LLM extraction for entities → you route + upsert via service resolvers → get {tempKey -> {label, id, naturalKey}}

LLM extraction for edges (only) → returns EvidenceEdgeInput[] with sourceId as chunkId/documentId and target as {label, id} (prefer) or {label, naturalKey} (fallback)

upsertEvidenceEdges(edges[])

The actual EvidenceEdgeInput format you want (robust + drop-in)

Here’s a “drop-in” edge object that your API can accept:

{
  "source": { "label": "Chunk", "id": "123" },
  "type": "ABOUT",
  "target": { "label": "Product", "id": "987" },
  "properties": {
    "aboutness": 0.84,
    "aspect": "efficacy",
    "stance": "positive",
    "surfaceForm": "NeuroSpark",
    "linkingMethod": "llm_linker"
  },
  "provenance": {
    "mongoRunId": "run_synth_20260206_001",
    "mongoPlanId": "plan_synth_case_study_v1",
    "stageKey": "edge_extraction",
    "subStageKey": "about_mentions",
    "extractorVersion": "ingest-v0.1",
    "extractedAt": "2026-02-06T15:05:00Z",
    "confidence": 0.86,
    "validAt": "2026-02-06T15:05:00Z",
    "expiredAt": null,
    "invalidAt": null,
    "createdAt": "2026-02-06T15:05:00Z",
    "updatedAt": "2026-02-06T15:05:00Z"
  }
}

Key rule

Prefer target.id always, since you have it after typed upserts.
Allow target.naturalKey only as a fallback when an entity is “known” but not upserted.

Document vs Chunk evidence edges (when to use each)
Canonical (should be most edges)

✅ Chunk-[:ABOUT|:MENTIONS]->Entity

This is what your GraphRAG uses for accountable evidence.

Optional cache / coarse summary

⚪️ Document-[:ABOUT|:MENTIONS]->Entity

Use this only when:

you’re linking an entity to the document as a whole (e.g., transcript topic), or

you’re writing a derived cache later.

For ingestion today: you can allow the LLM to output document-level edges only when it’s clearly global (e.g. “this document is about creatine + brain performance”).

Edge extraction prompt inputs (what you pass in)

Since you already have:

documentId

chunks: [{chunkId, index, text}]

resolved entities: [{label, id, naturalKey, name, aliases?}]

…you pass those into the edge-only prompt.

Minimal inputs to pass

documentId and document metadata (title/type)

For each chunk: chunkId, index, and text (optionally truncated)

Entity registry: IDs + label + displayName, optionally aliases

Edge extraction output schema (strongly recommended)

Have the model output exactly this:

{
  "edges": [
    {
      "source": { "label": "Chunk", "id": "..." },
      "type": "ABOUT",
      "target": { "label": "Product", "id": "..." },
      "properties": { "aboutness": 0.7, "aspect": "efficacy" }
    }
  ]
}


Then your ingestion code:

attaches provenance to every edge (don’t make the LLM fill timestamps)

validates source.id exists in your chunkId set

validates target.id exists in your resolved entities set

clamps floats, validates enums, etc.

Validation rules that make this bulletproof

Before calling upsertEvidenceEdges():

Source validation

If source.label == "Chunk": source.id must be in chunkIds

If source.label == "Document": source.id must equal documentId

Target validation

Must include label

Must include either:

id and it must exist in your resolved entity map, OR

naturalKey and label (API will match by naturalKey)

Relationship constraints

Allow only types: ABOUT, MENTIONS (for today)

Properties schema by type:

ABOUT: allow aboutness, aspect, stance

MENTIONS: allow surfaceForm, linkingMethod, confidence

Dedup

Create a deterministic edge key in ingestion (or rely on your API relKey):

sourceId|type|targetId|stageKey|mongoRunId
So you can safely rerun.

Do you need two LLM calls or one?

Best practice: two calls.

Entity extraction + routing (your current approach)

Edge extraction using resolved entity IDs (this step)

It’s more precise, and you can keep the edge prompt much simpler.

Practical recommendation for “robust edges”

For today’s run, have your edge model output:

Chunk-level ABOUT and MENTIONS

(Optional) a few Document-level ABOUT only if it’s clearly global

Then later, you can add a deterministic derived cache job:

Document ABOUT Entity if >= N chunks ABOUT entity and avg/aboutness >= threshold.