import { Embedder } from "../../embeddings/openaiEmbedder.js"; 
import type { CypherParams } from "../../db/neo4j/types.js";
import type { SearchMode } from "../../graphql/enums/index.js";
import type { Record as Neo4jRecord } from "neo4j-driver";

export type EntitySearchDeps = {
    embedder?: Embedder;
    // tuning knobs (good defaults)
    kFulltext?: number;
    kVector?: number;
    rrfK?: number;
    exactBoost?: number;
  };
  

  export type CypherStatement = {
    cypher: string;
  };
  
  export type ModeRunnerContext<TValidatedInput> = {
    validatedInput: TValidatedInput;
    deps: EntitySearchDeps;
  };
  
  export type ModeRunnerResult<THit, TResult> = TResult;
  
  export type ModeRunner<TValidatedInput, TResult> = (
    ctx: ModeRunnerContext<TValidatedInput>
  ) => Promise<TResult>;
  
  export type ModeRouter<TValidatedInput, TResult> = Record<
    SearchMode,
    ModeRunner<TValidatedInput, TResult>
  >;
  
  /**
   * Helper: map Neo4j record into your result items.
   * Keep this per-entity since field names differ (organizationId vs productId, etc).
   */
  export type RecordToHit<THit> = (rec: Neo4jRecord) => THit;