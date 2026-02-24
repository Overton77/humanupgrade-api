Media mutation + edge input standard (v1)

All Media writes use upsert<Model> mutations (e.g., upsertEpisode, upsertChannel, upsertSeries, upsertEpisodeSegments, upsertClaimOccurrences). For every relationship/edge input within these media mutations, the only allowed operations are:

connect — link to an existing node by ID

connectByKey — link (or resolve) by a supported natural key (e.g., platformKey + platformContentId)

upsert — create-or-update the related node using a model-specific ModelRelateUpsertInput

No create or update variants are used on media edge inputs; upsert replaces both. Relationship properties (if any) are provided alongside the edge input and are applied additively: connect if missing, otherwise update the relationship properties that are supplied.
