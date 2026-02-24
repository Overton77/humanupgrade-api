🔵 NODE DEFINITIONS
1️⃣ Platform
Label

Platform

Properties
Property Type Notes
platformId string Unique
canonicalName string
aliases [string]
platformType enum video | podcast | blog | social | newsletter | aggregator | other
description string?
websiteUrl string?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
2️⃣ Channel
Label

Channel

Properties
Property Type Notes
channelId string Unique
canonicalName string
aliases [string]
description string?
channelHandle string?
platformChannelId string?
webPageUrl string?
rssUrl string?
imageUrl string?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
3️⃣ Series
Label

Series

Properties
Property Type Notes
seriesId string Unique
canonicalName string
aliases [string]
description string?
seriesType enum podcast_series | youtube_playlist | lecture_series | course_series | other
webPageUrl string?
imageUrl string?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
4️⃣ Episode
Label

Episode

Core Properties
Property Type
episodeId string (unique)
canonicalName string
description string?
publishedAt datetime?
durationSec int?
language string?
Retrieval / Content Fields
Property Type
s3TranscriptUrl string?
transcriptUrl string?
webPageUrl string?
webPageSummary string?
searchText string?
embedding string?
Platform / Social URLs
Property Type
youtubeUrl string?
youtubeWatchUrl string?
youtubeEmbedUrl string?
socialUrlsJson string?
timestampsJson string?
Validity
Property Type
valid_at datetime?
invalid_at datetime?
expired_at datetime?
5️⃣ EpisodeSegment
Label

EpisodeSegment

Properties
Property Type
episodeSegmentId string (unique)
canonicalName string
description string?
orderIndex int?
startTimeSec int?
endTimeSec int?
timeRangeJson string?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
6️⃣ Community
Label

Community

Properties
Property Type
communityId string (unique)
canonicalName string
aliases [string]
description string?
communityType enum = online | local | professional | research | interest | other
websiteUrl string?
socialUrlsJson string?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
7️⃣ Conference
Label

Conference

Properties
Property Type
conferenceId string (unique)
canonicalName string
aliases [string]
description string?
conferenceType enum = academic | industry | community | trade_show | workshop | other
websiteUrl string?
locationText string?
startDate date?
endDate date?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
8️⃣ ClaimOccurrence
Label

ClaimOccurrence

Required
Property Type
claimOccurrenceId string (unique)
canonicalText string
Strongly Recommended
Property Type
normalizedText string?
occurrenceKey string?
confidence float?
Anchoring
Property Type
startTimeSec int?
endTimeSec int?
startChar int?
endChar int?
Metadata
Property Type
language string?
sourceType enum = transcript | captions | description | show_notes | webpage | manual | other
extractionMethod enum = llm | rules | human | hybrid | other
createdAt datetime?
updatedAt datetime?
valid_at datetime?
invalid_at datetime?
expired_at datetime?
Retrieval (Optional)
Property Type
searchText string?
embedding string?
🟣 RELATIONSHIPS

Below: Direction → Type → Properties

PLATFORM GRAPH
(Platform)-[:HOSTS_CHANNEL]->(Channel)

No properties

(Channel)-[:ON_PLATFORM]->(Platform)

No properties

CHANNEL ↔ SERIES ↔ EPISODE
(Channel)-[:HAS_SERIES]->(Series)

Properties:

orderIndex:int?

valid_at

invalid_at

expired_at

(Series)-[:IN_CHANNEL]->(Channel)

No properties

(Series)-[:INCLUDES_EPISODE]->(Episode)

Properties:

orderIndex:int?

valid_at

invalid_at

expired_at

(Channel)-[:HAS_EPISODE]->(Episode)

Properties:

publishedAt:datetime?

valid_at

invalid_at

expired_at

(Episode)-[:IN_SERIES]->(Series)

Properties:

orderIndex:int?

valid_at

invalid_at

expired_at

(Episode)-[:IN_CHANNEL]->(Channel)

No properties

(Episode)-[:ON_PLATFORM]->(Platform)

No properties

EPISODE SEGMENTS
(Episode)-[:HAS_SEGMENT]->(EpisodeSegment)

Properties:

orderIndex:int?

valid_at

invalid_at

expired_at

(EpisodeSegment)-[:IN_EPISODE]->(Episode)

No properties

TRANSCRIPTS
(Episode)-[:HAS_TRANSCRIPT]->(Document)

Properties:

role:string?

rank:int?

createdAt

updatedAt

valid_at

invalid_at

expired_at

COMMUNITY / CONFERENCE
(Community)-[:HOSTS_EVENT]->(Conference)

Properties:

valid_at

invalid_at

expired_at

ORGANIZATION ↔ MEDIA
(Organization)-[:OWNS_OR_OPERATES_CHANNEL]->(Channel)

Properties:

role enum = owner | operator | publisher | network | production_company | distributor | agency | other

startDate

endDate

isCurrent:boolean?

confidence:float?

valid_at

invalid_at

expired_at

(Organization)-[:SPONSORS_CHANNEL]->(Channel)

Properties:

sponsorshipType enum = exclusive | primary | segment_sponsor | affiliate | paid_placement | owned_media | unknown

startDate

endDate

isCurrent

disclosureConfidence:float?

sourceType enum = dataset | description_text | transcript | manual | other

valid_at

invalid_at

expired_at

(Organization)-[:SPONSORS_EPISODE]->(Episode)

Properties:

sponsorshipType enum = title_sponsor | midroll | preroll | segment_sponsor | affiliate | paid_placement | unknown

sponsorMentionsCount:int?

adReadBy enum = host | guest | announcer | unknown

startTimeSec:int?

endTimeSec:int?

disclosureConfidence:float?

sourceType enum

valid_at

invalid_at

expired_at

(Organization)-[:PUBLISHES_SERIES]->(Series)

Properties:

role enum = publisher | distributor | network | production_company | other

startDate

endDate

isCurrent

confidence

valid_at

invalid_at

expired_at

PERSON ↔ MEDIA
(Person)-[:HAS_ROLE_ON_CHANNEL]->(Channel)

Properties:

role enum = host | co_host | creator | producer | editor | contributor | narrator | guest_host | other

startDate

endDate

isCurrent

typicalAppearance enum = on_camera | voice | behind_scenes

confidence

valid_at

invalid_at

expired_at

(Person)-[:APPEARS_IN_EPISODE]->(Episode)

Properties:

appearanceRole enum = host | co_host | guest | panelist | interviewer | interviewee | narrator | expert | caller | other

billingOrder:int?

confidence

valid_at

invalid_at

expired_at

(ClaimOccurrence)-[:UTTERED_BY]->(Person)

Properties:

confidence?

valid_at

invalid_at

expired_at

CLAIM / PROVENANCE
(ClaimOccurrence)-[:OCCURS_IN]->(Episode)

Properties:

valid_at

invalid_at

expired_at

(ClaimOccurrence)-[:OCCURS_IN_SEGMENT]->(EpisodeSegment)

Properties:

startTimeSec:int?

endTimeSec:int?

confidence:float?

valid_at

invalid_at

expired_at

(ClaimOccurrence)-[:SUPPORTED_BY]->(Chunk)

Properties:

quoteText:string?

startChar:int?

endChar:int?

valid_at

invalid_at

expired_at

(Chunk)-[:ABOUT]->(Episode|EpisodeSegment)

Properties:

salience:float?

valid_at

invalid_at

expired_at

🟢 COMPLETE NODE LABEL LIST
Platform
Channel
Series
Episode
EpisodeSegment
Community
Conference
ClaimOccurrence
Organization
Person
Document
Chunk
🟢 COMPLETE RELATIONSHIP TYPE LIST
HOSTS_CHANNEL
ON_PLATFORM
HAS_SERIES
IN_CHANNEL
INCLUDES_EPISODE
HAS_EPISODE
IN_SERIES
IN_CHANNEL
ON_PLATFORM
HAS_SEGMENT
IN_EPISODE
HAS_TRANSCRIPT
HOSTS_EVENT
OWNS_OR_OPERATES_CHANNEL
SPONSORS_CHANNEL
SPONSORS_EPISODE
PUBLISHES_SERIES
HAS_ROLE_ON_CHANNEL
APPEARS_IN_EPISODE
UTTERED_BY
OCCURS_IN
OCCURS_IN_SEGMENT
SUPPORTED_BY
ABOUT
