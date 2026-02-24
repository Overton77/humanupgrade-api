Scope

This document covers the Media layer:

Platform, Channel, Series, Episode, EpisodeSegment

Community, Conference

And specifies (relationship-only) links to:

Organization, Person, Document, ClaimOccurrence, Chunk

It also recommends GraphQL mutation patterns designed for ingestion without exploding input sizes.

Part 1 — Media Ontology v1 (Easy Reference)

1. Platform

Meaning: Hosting / distribution platform (YouTube, Apple Podcasts, Spotify, Substack, X, etc.)

Node properties

platformId: string (unique)

canonicalName: string

aliases: [string]

platformType: enum = video | podcast | blog | social | newsletter | aggregator | other

description: string?

websiteUrl: string?

valid_at: datetime?

invalid_at: datetime?

Outgoing relationships

(p:Platform)-[:HOSTS_CHANNEL]->(c:Channel)

relationship properties: (none required)

2. Channel

Meaning: A publisher identity on a platform (e.g., “Huberman Lab” YouTube channel)

Node properties

channelId: string (unique)

canonicalName: string

aliases: [string]

description: string?

channelHandle: string? (e.g., @name)

platformChannelId: string? (native ID on platform)

webPageUrl: string? (canonical page)

rssUrl: string?

imageUrl: string?

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Outgoing relationships

(c:Channel)-[:ON_PLATFORM]->(p:Platform) (optional convenience; otherwise derive via Platform→Channel)

relationship properties: (none required)

(c:Channel)-[:HAS_SERIES {orderIndex:int?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(s:Series)

orderIndex optional

(c:Channel)-[:HAS_EPISODE {publishedAt:datetime?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(e:Episode) (optional; only keep if you want channel→episode direct)

publishedAt optional (denormalized copy)

3. Series

Meaning: A show / playlist / feed grouping under a channel (may be absent for many channels)

Node properties

seriesId: string (unique)

canonicalName: string

aliases: [string]

description: string?

seriesType: enum = podcast_series | youtube_playlist | lecture_series | course_series | other

webPageUrl: string?

imageUrl: string?

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Outgoing relationships

(s:Series)-[:IN_CHANNEL]->(c:Channel) (optional convenience; otherwise derive via Channel→Series)

relationship properties: (none required)

(s:Series)-[:INCLUDES_EPISODE {orderIndex:int?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(e:Episode)

orderIndex optional but recommended for playlist ordering

4. Episode

Meaning: A single published media item (video, podcast episode, article, livestream replay, etc.)

Node properties (core identifiers)

episodeId: string (unique)

canonicalName: string (usually published title)

description: string?

publishedAt: datetime?

durationSec: int?

language: string?

Node properties (content & retrieval fields)

s3TranscriptUrl: string?

transcriptUrl: string?

webPageUrl: string?

webPageSummary: string?

searchText: string?

embedding: string? (vector serialized as string; or Neo4j vector later)

Node properties (YouTube / social URLs)

youtubeUrl: string?

youtubeWatchUrl: string?

youtubeEmbedUrl: string?

socialUrlsJson: string? (JSON string; major social/podcast URLs)

Suggested shape:

{"spotify":"...","applePodcasts":"...","x":"...","instagram":"...","tiktok":"...","substack":"...","linkedin":"...","rumble":"..."}
Node properties (special timestamp JSON string)

timestampsJson: string? (JSON string; chapters-like data in addition to segments)

Suggested shape:

[{"start":0,"end":120,"title":"Intro","description":"..."},{"start":120,"end":900,"title":"Topic A","description":"..."}]
Validity fields

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Outgoing relationships

(e:Episode)-[:HAS_SEGMENT {orderIndex:int?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(seg:EpisodeSegment)

orderIndex recommended

(e:Episode)-[:IN_CHANNEL]->(c:Channel) (optional convenience)

relationship properties: (none required)

(e:Episode)-[:IN_SERIES {orderIndex:int?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(s:Series) (optional convenience)

orderIndex mirrors Series→Episode ordering if needed

(e:Episode)-[:ON_PLATFORM]->(p:Platform) (optional convenience)

relationship properties: (none required)

(e:Episode)-[:HAS_TRANSCRIPT {role:string?, rank:int?, createdAt:datetime?, updatedAt:datetime?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(d:Document)

role suggested: full_transcript | captions | partial | auto_generated | human_verified | other

rank used to choose canonical transcript if multiple exist

5. EpisodeSegment

Meaning: A segment anchored to time (or text range), for “jump to timestamp” explainability.

Node properties

episodeSegmentId: string (unique)

canonicalName: string (segment title)

description: string?

orderIndex: int? (optional if you store only on relationship)

startTimeSec: int?

endTimeSec: int?

timeRangeJson: string? (optional; JSON string for richer timing metadata)

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Outgoing relationships

(seg:EpisodeSegment)-[:IN_EPISODE]->(e:Episode) (optional convenience)

relationship properties: (none required)

6. Community

Meaning: Group/community that hosts events (online/offline). Media-adjacent discovery layer.

Node properties

communityId: string (unique)

canonicalName: string

aliases: [string]

description: string?

communityType: enum = online | local | professional | research | interest | other

websiteUrl: string?

socialUrlsJson: string? (JSON string)

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Outgoing relationships

(com:Community)-[:HOSTS_EVENT {valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(conf:Conference)

relationship properties: validity fields only (unless you add role, notes)

7. Conference

Meaning: A conference brand/entity (can have occurrences by year; add Event later if needed).

Node properties

conferenceId: string (unique)

canonicalName: string

aliases: [string]

description: string?

conferenceType: enum = academic | industry | community | trade_show | workshop | other

websiteUrl: string?

locationText: string?

startDate: date?

endDate: date?

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Outgoing relationships

(none required in minimal media slice; add HAS_EVENT later if you introduce Event)

8. ClaimOccurence

ClaimOccurrence

Meaning: A single instance of a claim being made in some source context (episode, segment, document). This is the event / utterance anchor you use for timestamps, quotes, “who said it,” and evidence spans.

Node properties

Required

claimOccurrenceId: string (unique)

canonicalText: string (the quote/claim text as extracted; or best normalized rendering)

Strongly recommended (for ingestion + dedupe)

normalizedText: string? (lowercased/whitespace-normalized; optional light canonicalization)

occurrenceKey: string? (deterministic hash; e.g., episodeKey + time range + normalizedText + speakerKey?)

confidence: float? (0–1, extraction confidence)

Anchoring fields (pick the ones you support now)

startTimeSec: int?

endTimeSec: int?

startChar: int? (offset in transcript text if you store it)

endChar: int?

Context & metadata

language: string?

sourceType: enum? = transcript | captions | description | show_notes | webpage | manual | other

extractionMethod: enum? = llm | rules | human | hybrid | other

createdAt: datetime?

updatedAt: datetime?

valid_at: datetime?

invalid_at: datetime?

expired_at: datetime?

Optional retrieval fields (only if you want claim-level search)

searchText: string? (often = canonicalText + some context)

embedding: string?

\*\* NOTE ON CLAIM OCCURENCE Inputs at top level or nested under other models <Episode in particular>

When ClaimOccurrence objects are provided as nested inputs (e.g., inside upsertEpisode, upsertEpisodeSegments, or upsertClaimOccurrences), each occurrence may include an utteredBy field to ensure consistent attribution at creation time. The utteredBy field should accept the existing PersonRelateInput or a new PersonUpsertRelateInput that has connectByKey, connect, upsert and must support either:

connect { personId } (link to an existing Person), or

upsert { …person fields… } (create-or-update Person by natural key / id)

Resolver behavior: if utteredBy is present, the resolver creates/updates the (:Person) (if using upsert) and ensures a single edge
(co:ClaimOccurrence)-[:UTTERED_BY {confidence?, valid_at?, invalid_at?, expired_at?}]->(p:Person) exists (updating relationship properties if provided). If utteredBy is omitted, the occurrence may be ingested without a Person attribution (or optionally assigned to an AnonymousActor by policy), but when provided it must be honored and should be the preferred pathway for attribution during media ingestion.

Part 2 — Non-media links (relationship specs + properties only)
A) Organization ↔ Media
Organization operates/owns channel

(o:Organization)-[:OWNS_OR_OPERATES_CHANNEL {role:enum, startDate:date?, endDate:date?, isCurrent:boolean?, confidence:float?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(c:Channel)

role enum: owner | operator | publisher | network | production_company | distributor | agency | other

Organization sponsors channel

(o:Organization)-[:SPONSORS_CHANNEL {sponsorshipType:enum, startDate:date?, endDate:date?, isCurrent:boolean?, disclosureConfidence:float?, sourceType:enum, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(c:Channel)

sponsorshipType: exclusive | primary | segment_sponsor | affiliate | paid_placement | owned_media | unknown

sourceType: dataset | description_text | transcript | manual | other

Organization sponsors episode

(o:Organization)-[:SPONSORS_EPISODE {sponsorshipType:enum, sponsorMentionsCount:int?, adReadBy:enum?, startTimeSec:int?, endTimeSec:int?, disclosureConfidence:float?, sourceType:enum, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(e:Episode)

sponsorshipType: title_sponsor | midroll | preroll | segment_sponsor | affiliate | paid_placement | unknown

adReadBy: host | guest | announcer | unknown

Organization publishes/distributes series (optional)

Useful if series is owned by a network but lives on multiple channels.

(o:Organization)-[:PUBLISHES_SERIES {role:enum, startDate:date?, endDate:date?, isCurrent:boolean?, confidence:float?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(s:Series)

role: publisher | distributor | network | production_company | other

B) Person ↔ Media
Person has role on channel (host/creator/producer)

(p:Person)-[:HAS_ROLE_ON_CHANNEL {role:enum, startDate:date?, endDate:date?, isCurrent:boolean?, typicalAppearance:enum?, confidence:float?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(c:Channel)

role: host | co_host | creator | producer | editor | contributor | narrator | guest_host | other

typicalAppearance: on_camera | voice | behind_scenes

Person appears in episode (cast list level)

(p:Person)-[:APPEARS_IN_EPISODE {appearanceRole:enum, billingOrder:int?, confidence:float?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(e:Episode)

appearanceRole: host | co_host | guest | panelist | interviewer | interviewee | narrator | expert | caller | other

C) ClaimOccurrence / Chunk ↔ Media (provenance anchors)
ClaimOccurrence occurs in episode

(co:ClaimOccurrence)-[:OCCURS_IN {valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(e:Episode)

ClaimOccurrence occurs in segment (timestamp anchor)

(co:ClaimOccurrence)-[:OCCURS_IN_SEGMENT {startTimeSec:int?, endTimeSec:int?, confidence:float?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(seg:EpisodeSegment)

Chunk references segment or episode (quote span / passage location)

(ch:Chunk)-[:ABOUT {salience:float?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(e:Episode|seg:EpisodeSegment)

ClaimOccurrence supported by Chunk (quote evidence)

(co:ClaimOccurrence)-[:SUPPORTED_BY {quoteText:string?, startChar:int?, endChar:int?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(ch:Chunk)

D) Document ↔ Media (transcripts / show notes)
Episode has transcript document (canonical bridge)

(e:Episode)-[:HAS_TRANSCRIPT {role:string?, rank:int?, createdAt:datetime?, updatedAt:datetime?, valid_at:datetime?, invalid_at:datetime?, expired_at:datetime?}]->(d:Document)

Part 3 — Ingestion-first mutation strategy (avoid input ballooning)
Recommended mutation grouping
Group A — Media publishing graph

upsertPlatform

upsertChannel

upsertSeries

upsertEpisode ✅ main ingestion workhorse

Group B — Timeline + provenance

upsertEpisodeSegments (batch)

upsertClaimOccurrences (batch) ✅ second ingestion workhorse

Two “rule-them-all” entry points

upsertEpisode(...) — creates/links platform/channel/series/episode/transcript pointers

upsertClaimOccurrences(...) — creates claims, links to episode/segment, uttered_by, supported_by

Everything else stays thin.

Part 4 — Node identification (connect-by-key) for ingestion

Avoid needing Neo4j IDs during ingestion. Use natural keys:

Platform: canonicalName or normalized platformKey (e.g. youtube)

Channel:

(platformKey, platformChannelId) OR

(platformKey, channelHandle) OR

(platformKey, webPageUrl)

Series:

(channelKey, seriesPlatformId) OR

(channelKey, canonicalName)

Episode:

(platformKey, platformContentId) (YouTube videoId / podcast GUID) OR

webPageUrl (fallback)

EpisodeSegment:

(episodeKey, startTimeSec, endTimeSec, canonicalName) OR

(episodeKey, orderIndex)

ClaimOccurrence:

provided claimOccurrenceId OR

deterministic hash of (episodeKey + start/end + normalized claim text + utteredByKey?)

This is how inputs stay small: connect via keys, not via deep nested create/connect/update everywhere.

Part 5 — GraphQL input patterns (minimal, consistent)
A) Minimal “relate” pattern

Use this pattern only where needed:

input RelateInput {
connect: ConnectByIdInput
connectByKey: ConnectByKeyInput
upsert: UpsertInput
}

Notes

You don’t need create if upsert is create-or-update.

For manual UI flows, connect by ID is common.

For ingestion flows, upsert + connectByKey is common.

B) Resolver semantics (consistent everywhere)

Upsert mergeKey logic

if id provided → upsert by id

else if connectByKey present → upsert by natural key

else error (require at least one key)

Relation patch semantics

default: additive

connect missing edges

update relationship properties if provided

allow REPLACE_ALL only for list relations that ingest “refreshes” frequently:

episode segments

series episode order

episode participants (if you ingest cast lists)

Part 6 — Concrete mutation recommendations

1. upsertEpisode (primary ingestion mutation)

Because ingestion usually begins from a URL (YouTube link, RSS item, page scrape).

Mutation

upsertEpisode(input: EpisodeUpsertInput!): EpisodePayload!

EpisodeUpsertInput contains

episode scalars

title/description/publishedAt/durationSec/language

urls fields (webPageUrl, youtubeWatchUrl, etc.)

timestampsJson, transcript URLs, webPageSummary, searchText, embedding, socialUrlsJson

relations patch

inChannel (connectByKey or upsert)

inSeries[] (connectByKey or upsert + orderIndex)

onPlatform (connectByKey or upsert) (optional if derivable via channel)

hasTranscript (connect Document by id, or by transcript-url key if you do Document upsert elsewhere)

Edge patches should be small

EpisodeInSeriesEdgeInput { series: SeriesRefInput!, orderIndex: Int }

EpisodeInChannelEdgeInput { channel: ChannelRefInput! }

2. upsertPlatform / upsertChannel / upsertSeries (thin admin + ingestion helpers)

These exist mainly for:

manual correction

ingestion when you crawl platform/channel pages directly

Each should accept:

scalar fields

a small relations patch:

Channel: onPlatform (and optionally org/person relationships; see next section)

Series: inChannel

3. upsertEpisodeSegments (batch)

Segments typically come from:

chapters/timestamps extraction

transcript segmentation

editorial annotation

Mutation

upsertEpisodeSegments(input: EpisodeSegmentsUpsertInput!): EpisodeSegmentsPayload!

Input

episodeRef (connectByKey or id)

mode: enum = PATCH | REPLACE_ALL

segments: [EpisodeSegmentUpsert!]! (segment scalars only)

4. upsertClaimOccurrences (batch)

This is transcript parsing / NER / quote anchoring.

Mutation

upsertClaimOccurrences(input: ClaimOccurrencesUpsertInput!): ClaimOccurrencesPayload!

Input

episodeRef (required)

occurrences: [ClaimOccurrenceUpsert!]!

Each occurrence supports:

scalar fields: claim text, normalizedText, start/end time or char offsets, confidence

relations:

occursInSegment (connectByKey or upsert segment ref)

utteredBy (PersonRef / PseudonymousActorRef / AnonymousActorRef)

supportedByChunks (Chunk refs)

5. Community + Conference (keep simple)

upsertCommunity(input: CommunityUpsertInput!)

upsertConference(input: ConferenceUpsertInput!)

If/when you add:

Community-STARTED_BY->Person

Conference-FUNDED_BY->Organization

…add them as optional relation patches, not mandatory.

Part 7 — Organization → Media suggestions (and how to allow create/connect from media inputs)

You said: “It would be nice to add connect, create in those media inputs even though they are incoming.”

✅ Do it, but only on Channel and Episode, because that’s where org relationships are highest-value and frequently ingested.

A) Add Organization relation patches on ChannelUpsertInput and EpisodeUpsertInput

1. Channel: allow these optional patches

operatedByOrgs: [ChannelOperatedByOrganizationRelateUpdateInput!]

sponsors: [ChannelSponsorOrganizationRelateUpdateInput!]

Where each item can be connect, upsert/create, or (optional) update relationship props.

Relationship properties (recap)

OWNS_OR_OPERATES_CHANNEL: role, startDate, endDate, isCurrent, confidence, valid_at, invalid_at, expired_at

SPONSORS_CHANNEL: sponsorshipType, startDate, endDate, isCurrent, disclosureConfidence, sourceType, valid_at...

2. Episode: allow these optional patches

sponsors: [EpisodeSponsorOrganizationRelateUpdateInput!]

Relationship properties

SPONSORS_EPISODE: sponsorshipType, sponsorMentionsCount, adReadBy, startTimeSec, endTimeSec, disclosureConfidence, sourceType, valid_at...

B) Keep Org relation inputs small (do NOT copy Organization mega-input)

Use a reference-first approach:

OrganizationRef pattern (recommended)

Each org relation item should allow:

connect { organizationId }

connectByKey { canonicalName | websiteUrl | domain | externalIds... } (whatever your org natural keys are)

create { minimalOrgFields } (optional)

upsert { minimalOrgFields + key }

Minimal org fields for media ingestion (suggested)

canonicalName

websiteUrl?

aliases?

maybe description?

Do not embed “Organization’s whole world” here.

C) Why this is safe despite being “incoming”

Even though the edge is from Organization to Channel/Episode, it’s totally fine for a media mutation to accept inputs that result in:

upserting an Organization (minimal)

connecting Organization → Channel/Episode with relationship props

This makes ingestion one-pass:

crawl an episode page

detect sponsor brand

attach sponsorship edge immediately

Part 8 — Minimal mutation set to ship first

upsertPlatform

upsertChannel

upsertSeries

upsertEpisode ✅

upsertEpisodeSegments ✅

upsertClaimOccurrences ✅

upsertCommunity

upsertConference

That’s the smallest set that stays clean, ingestion-friendly, and avoids Organization-style input explosions.
