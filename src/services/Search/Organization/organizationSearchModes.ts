// src/services/Search/Organization/organizationSearchModes.ts

import neo4j from "neo4j-driver";
import type { Record as Neo4jRecord } from "neo4j-driver";

import { runRead } from "../../../db/neo4j/executor.js";
import { neoInt } from "../../../db/neo4j/utils.js";
import type { ModeRouter, EntitySearchDeps } from "../types.js";
import type { SearchMode } from "../../../graphql/enums/index.js";

import { ORG_SEARCH_HYBRID_CYPHER, ORG_SEARCH_FIELD_ONLY_CYPHER } from "./statements/orgSearchStatements.js";


import { decodeCursor, encodeCursor } from "../utils/cursor.js";
import { decodeFieldCursor, encodeFieldCursor } from "../utils/fieldCursor.js";

import { normalizeFirst, nodeToObject, numOrNull } from "../utils/normalize.js";
import { buildReasonsFromRecord } from "../utils/buildSearchReasons.js";

import type {
  OrganizationSearchResult,
  OrganizationSearchHit,
} from "../../../graphql/types/SearchModel.js";

import type { OrganizationSearchInput } from "../../../graphql/inputs/SearchInputs.js";

/**
 * HYBRID runner (your current behavior), packaged as a mode function.
 */
async function runHybrid(
  validatedInput: OrganizationSearchInput,
  deps: EntitySearchDeps
): Promise<OrganizationSearchResult> {
  const qRaw = (validatedInput.q ?? "").trim();
  const q = qRaw.length > 0 ? qRaw : null;

  const explain = Boolean(validatedInput.explain);
  const first = normalizeFirst(validatedInput.page?.first);
  const cursor = decodeCursor(validatedInput.page?.after);

  const kFulltext = deps.kFulltext ?? 80;
  const kVector = deps.kVector ?? 80;
  const rrfK = deps.rrfK ?? 60;
  const exactBoost = deps.exactBoost ?? 0.25;

  let embedding: number[] | null = null;
  const wantsVector = true; // HYBRID runner only called when mode=HYBRID

  if (wantsVector && q && deps.embedder) {
    embedding = await deps.embedder.embed(q);
  }

  const filter = validatedInput.filter ?? null;

  const params = {
    q,
    embedding,
    kFulltext: neoInt(kFulltext),
    kVector: neoInt(kVector),
    rrfK,
    exactBoost,
    afterRankKey: cursor?.rankKey ?? null,
    afterTie: cursor?.tie ?? null,
    limitPlusOne: neoInt(first + 1),
    filter,
  };

  const res = await runRead(ORG_SEARCH_HYBRID_CYPHER, params);
  const rows = res.records;

  const hasNextPage = rows.length > first;
  const pageRows = hasNextPage ? rows.slice(0, first) : rows;

  const items: OrganizationSearchHit[] = pageRows.map((rec: Neo4jRecord) => {
    const node = nodeToObject(rec.get("node"));
    const score = numOrNull(rec.get("rankKey"));
    const reasons = buildReasonsFromRecord(rec, q, explain);

    return { node, score, reasons: reasons ?? null };
  });

  const endCursor =
    items.length > 0
      ? encodeCursor({
          rankKey: items[items.length - 1].score ?? 0,
          tie: String(items[items.length - 1].node.organizationId),
        })
      : null;

  return {
    items,
    pageInfo: { hasNextPage, endCursor },
  };
}

/**
 * FIELD_ONLY runner:
 * - ignores q relevance ranking
 * - uses filters + deterministic sort
 * - cursor based on (sortVal=name, tie=organizationId)
 */
async function runFieldOnly(
  validatedInput: OrganizationSearchInput,
  _deps: EntitySearchDeps
): Promise<OrganizationSearchResult> {
  const first = normalizeFirst(validatedInput.page?.first);
  const cursor = decodeFieldCursor(validatedInput.page?.after);

  const filter = validatedInput.filter ?? null;

  const params = {
    filter,
    afterSortVal: cursor?.sortVal ?? null,
    afterTie: cursor?.tie ?? null,
    limitPlusOne: neoInt(first + 1),
  };

  const res = await runRead(ORG_SEARCH_FIELD_ONLY_CYPHER, params);
  const rows = res.records;

  const hasNextPage = rows.length > first;
  const pageRows = hasNextPage ? rows.slice(0, first) : rows;

  const items: OrganizationSearchHit[] = pageRows.map((rec: Neo4jRecord) => {
    const node = nodeToObject(rec.get("node"));
    return {
      node,
      score: null,
      reasons: null,
    };
  });

  const endCursor =
    items.length > 0
      ? encodeFieldCursor({
          sortVal: String(rows[Math.min(first - 1, pageRows.length - 1)].get("sortVal")),
          tie: String(items[items.length - 1].node.organizationId),
        })
      : null;

  return {
    items,
    pageInfo: { hasNextPage, endCursor },
  };
}

/**
 * Stub runners for future modes (so the router is complete).
 * You can implement them later by adding statements.
 */
async function runFulltextOnly(
  validatedInput: OrganizationSearchInput,
  deps: EntitySearchDeps
): Promise<OrganizationSearchResult> {
  // Easiest interim: call HYBRID with embedding=null by not computing embedding.
  // But you'd ideally make a dedicated FT cypher.
  return runHybrid({ ...validatedInput }, { ...deps, embedder: undefined });
}

async function runVectorOnly(
  validatedInput: OrganizationSearchInput,
  deps: EntitySearchDeps
): Promise<OrganizationSearchResult> {
  const qRaw = (validatedInput.q ?? "").trim();
  const q = qRaw.length > 0 ? qRaw : null;
  if (!q || !deps.embedder) {
    return { items: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
  // Interim: runHybrid but force fulltext off by setting q null in a cloned input.
  // Better later: dedicated vector-only cypher.
  return runHybrid({ ...validatedInput, q: q }, deps);
}

/**
 * Router: SearchMode -> runner
 */
export const ORGANIZATION_MODE_RUNNERS: ModeRouter<
  OrganizationSearchInput,
  OrganizationSearchResult
> = {
  FIELD_ONLY: async ({ validatedInput, deps }) => runFieldOnly(validatedInput, deps),
  FULLTEXT_ONLY: async ({ validatedInput, deps }) => runFulltextOnly(validatedInput, deps),
  VECTOR_ONLY: async ({ validatedInput, deps }) => runVectorOnly(validatedInput, deps),
  HYBRID: async ({ validatedInput, deps }) => runHybrid(validatedInput, deps),
};
