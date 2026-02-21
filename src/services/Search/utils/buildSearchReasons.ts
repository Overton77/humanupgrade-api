import { SearchReason } from "../../../graphql/types/SearchModel.js";
import { numOrNull } from "./normalize.js";
import { Record as Neo4jRecord } from "neo4j-driver";


export function buildReasonsFromRecord(rec: Neo4jRecord, q: string | null, explain: boolean): SearchReason[] | null {
    if (!explain) return null;
  
    const ftRank = numOrNull(rec.get("ftRank"));
    const ftScore = numOrNull(rec.get("ftScore"));
    const vecRank = numOrNull(rec.get("vecRank"));
    const vecScore = numOrNull(rec.get("vecScore"));
    const boost = numOrNull(rec.get("boost"));
  
    const reasons: SearchReason[] = [];
  
    if (ftRank != null) {
      reasons.push({
        kind: "FULLTEXT_MATCH",
        field: "org_fulltext",
        value: q ?? undefined,
        score: ftScore ?? undefined,
        detail: `fulltext rank=${ftRank}`,
      });
    }
  
    if (vecRank != null) {
      reasons.push({
        kind: "VECTOR_MATCH",
        field: "embedding",
        value: q ?? undefined,
        score: vecScore ?? undefined,
        detail: `vector rank=${vecRank}`,
      });
    }
  
    if (boost != null && boost > 0) {
      reasons.push({
        kind: "BOOST_APPLIED",
        field: "name|aliases|publicTicker",
        value: q ?? undefined,
        score: boost,
        detail: "exact/identifier boost",
      });
    }
  
    return reasons;
  }
  