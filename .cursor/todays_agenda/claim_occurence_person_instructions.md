When ClaimOccurrence objects are provided as nested inputs (e.g., inside upsertEpisode, upsertEpisodeSegments, or upsertClaimOccurrences), each occurrence may include an utteredBy field to ensure consistent attribution at creation time. The utteredBy field should accept the existing PersonRelateInputSchema which has create and connect options

connect { personId } (link to an existing Person), or

upsert { …person fields… } (create-or-update Person by natural key / id)

Resolver behavior: if utteredBy is present, the resolver creates/updates the (:Person) (if using upsert) and ensures a single edge
(co:ClaimOccurrence)-[:UTTERED_BY {confidence?, valid_at?, invalid_at?, expired_at?}]->(p:Person) exists (updating relationship properties if provided). If utteredBy is omitted, the occurrence may be ingested without a Person attribution (or optionally assigned to an AnonymousActor by policy), but when provided it must be honored and should be the preferred pathway for attribution during media ingestion.
