export const ORG_SEARCH_HYBRID_CYPHER = `
/*
HYBRID Organization search:
- Fulltext candidates from org_fulltext
- Vector candidates from org_embedding_index (if embedding provided)
- Union candidates and fuse ranks using RRF
- Apply filters
- Cursor-based "search-after" pagination
*/

WITH
  $q            AS q,
  $embedding    AS embedding,
  $rrfK         AS rrfK,
  $exactBoost   AS exactBoost,
  $afterRankKey AS afterRankKey,
  $afterTie     AS afterTie,
  $filter       AS filter

// ----------------------------
// Fulltext candidates (topK)
// Always returns a list (maybe empty)
// ----------------------------
CALL {
  WITH q
  WITH q WHERE q IS NOT NULL AND trim(q) <> ""
  CALL db.index.fulltext.queryNodes("org_fulltext", q) YIELD node, score
  WITH node, score
  ORDER BY score DESC
  LIMIT $kFulltext
  WITH collect(node) AS nodes, collect(score) AS scores
  UNWIND range(0, size(nodes) - 1) AS i
  RETURN collect({
    id: nodes[i].organizationId,
    ftRank: i + 1,
    ftScore: scores[i]
  }) AS ft

  UNION

  WITH q
  WITH q WHERE q IS NULL OR trim(q) = ""
  RETURN [] AS ft
}

// ----------------------------
// Vector candidates (topK)
// Always returns a list (maybe empty)
// ----------------------------
CALL {
  WITH embedding
  WITH embedding WHERE embedding IS NOT NULL
  CALL db.index.vector.queryNodes("org_embedding_index", $kVector, embedding) YIELD node, score
  WITH node, score
  ORDER BY score DESC
  LIMIT $kVector
  WITH collect(node) AS nodes, collect(score) AS scores
  UNWIND range(0, size(nodes) - 1) AS i
  RETURN collect({
    id: nodes[i].organizationId,
    vecRank: i + 1,
    vecScore: scores[i]
  }) AS vec

  UNION

  WITH embedding
  WITH embedding WHERE embedding IS NULL
  RETURN [] AS vec
}

WITH ft, vec, q, rrfK, exactBoost, afterRankKey, afterTie, filter

// ----------------------------
// Union + aggregate by id
// ----------------------------
WITH (ft + vec) AS rows, q, rrfK, exactBoost, afterRankKey, afterTie, filter
UNWIND rows AS r
WITH
  r.id AS id,
  min(r.ftRank)   AS ftRank,
  max(r.ftScore)  AS ftScore,
  min(r.vecRank)  AS vecRank,
  max(r.vecScore) AS vecScore,
  q, rrfK, exactBoost, afterRankKey, afterTie, filter
WHERE id IS NOT NULL

MATCH (o:Organization { organizationId: id })

// ----------------------------
// Apply filters (all optional)
// ----------------------------
WHERE
  (filter IS NULL OR true)
  AND (filter.orgTypeIn IS NULL OR o.orgType IN filter.orgTypeIn)
  AND (filter.businessModelIn IS NULL OR o.businessModel IN filter.businessModelIn)
  AND (filter.publicTicker IS NULL OR o.publicTicker = filter.publicTicker)
  AND (filter.employeeCountMinGte IS NULL OR o.employeeCountMin >= filter.employeeCountMinGte)
  AND (filter.employeeCountMaxLte IS NULL OR o.employeeCountMax <= filter.employeeCountMaxLte)
  AND (
    filter.regionsServedAny IS NULL
    OR any(x IN filter.regionsServedAny WHERE x IN coalesce(o.regionsServed, []))
  )
  AND (
    filter.primaryIndustryTagsAny IS NULL
    OR any(x IN filter.primaryIndustryTagsAny WHERE x IN coalesce(o.primaryIndustryTags, []))
  )
  AND (filter.isActive IS NULL OR o.isActive = filter.isActive)

// ----------------------------
// Compute RRF + boosts
// ----------------------------
WITH
  o, ftRank, ftScore, vecRank, vecScore, q, rrfK, exactBoost, afterRankKey, afterTie,
  (
    (CASE WHEN ftRank IS NULL THEN 0.0 ELSE 1.0 / (toFloat(rrfK) + toFloat(ftRank)) END) +
    (CASE WHEN vecRank IS NULL THEN 0.0 ELSE 1.0 / (toFloat(rrfK) + toFloat(vecRank)) END)
  ) AS rrfScore,
  CASE
    WHEN q IS NULL OR trim(q) = "" THEN 0.0
    WHEN toLower(o.name) = toLower(q) THEN exactBoost
    WHEN o.publicTicker = q THEN exactBoost
    WHEN any(a IN coalesce(o.aliases, []) WHERE toLower(a) = toLower(q)) THEN exactBoost
    ELSE 0.0
  END AS boost

WITH
  o,
  (rrfScore + boost) AS finalScore,
  round((rrfScore + boost) * 1000000.0) / 1000000.0 AS rankKey,
  ftRank, ftScore, vecRank, vecScore, boost,
  afterRankKey, afterTie

// ----------------------------
// Cursor "search-after"
// rankKey DESC, organizationId ASC
// ----------------------------
WHERE
  afterRankKey IS NULL
  OR rankKey < afterRankKey
  OR (rankKey = afterRankKey AND o.organizationId > afterTie)

RETURN
  o AS node,
  finalScore,
  rankKey,
  ftRank,
  ftScore,
  vecRank,
  vecScore,
  boost
ORDER BY rankKey DESC, node.organizationId ASC
LIMIT $limitPlusOne
`;


export const ORG_SEARCH_FIELD_ONLY_CYPHER = `
/*
FIELD_ONLY Organization listing with filters + deterministic sort + cursor pagination.

Cursor "search-after" based on (sortValue, tieId).
Default: name ASC, organizationId ASC (stable).
You can extend later to support multiple sort fields.
*/

WITH
  $filter       AS filter,
  $afterSortVal AS afterSortVal,
  $afterTie     AS afterTie

MATCH (o:Organization)

// Filters (same semantics as hybrid)
WHERE
  (filter IS NULL OR true)
  AND (filter.orgTypeIn IS NULL OR o.orgType IN filter.orgTypeIn)
  AND (filter.businessModelIn IS NULL OR o.businessModel IN filter.businessModelIn)
  AND (filter.publicTicker IS NULL OR o.publicTicker = filter.publicTicker)
  AND (filter.employeeCountMinGte IS NULL OR o.employeeCountMin >= filter.employeeCountMinGte)
  AND (filter.employeeCountMaxLte IS NULL OR o.employeeCountMax <= filter.employeeCountMaxLte)
  AND (
    filter.regionsServedAny IS NULL
    OR any(x IN filter.regionsServedAny WHERE x IN coalesce(o.regionsServed, []))
  )
  AND (
    filter.primaryIndustryTagsAny IS NULL
    OR any(x IN filter.primaryIndustryTagsAny WHERE x IN coalesce(o.primaryIndustryTags, []))
  )
  AND (filter.isActive IS NULL OR o.isActive = filter.isActive)

WITH
  o,
  coalesce(o.name, "") AS sortVal,
  o.organizationId AS tie

// Cursor: (name ASC, id ASC)
WHERE
  afterSortVal IS NULL
  OR sortVal > afterSortVal
  OR (sortVal = afterSortVal AND tie > afterTie)

RETURN
  o AS node,
  sortVal,
  tie
ORDER BY sortVal ASC, tie ASC
LIMIT $limitPlusOne
`;