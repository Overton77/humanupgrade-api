Global conventions (applies everywhere)
0.1 Lifecycle fields (ALL structured nodes + ALL structured relationships)

createdAt: DateTime (schema often requires createdAt! on nodes and edges) 

neo4j_knowledge_graph_graphql_s…

updatedAt: DateTime (you want it as a must-have; schema currently includes updatedAt on some ingestion nodes/edges but not all domain nodes/edges — recommend standardizing it across the domain layer)

validAt: DateTime | null

invalidAt: DateTime | null

expiredAt: DateTime | null

0.2 Provenance (ALL relationships; optional on nodes)

You want “provenance” everywhere; schema already has strong provenance on ingestion/evidence edges (MENTIONS/ABOUT/GeneratedBy), but domain edges mostly have claimIds + source/notes in a few places. 

neo4j_knowledge_graph_graphql_s…

Recommended flattened provenance fields (edge-level):

claimIds: [String] | null (already present on most commerce edges in schema) 

neo4j_knowledge_graph_graphql_s…

source: Enum(CURATED | IMPORTED | DERIVED) | null (already used on platform edges) 

neo4j_knowledge_graph_graphql_s…

provenanceRunId: String | null (maps to mongoRunId when facts originate from research runs)

provenancePlanId: String | null (maps to mongoPlanId)

extractorVersion: String | null

extractedAt: DateTime | null

evidenceNotes: String | null

Keep the ingestion/evidence edges as your “hard provenance”; keep domain edges lightweight (claimIds + source + optional run linkage) unless you truly need full traceability on every fact.

0.3 JSON avoidance rule

No Neo4j map properties

Any “json” field becomes String (serialized JSON) only when it’s unusually powerful.
In this slice, the specimen constraints you provided are already fully flattened, so no JSON is required.

1) Nodes (grouped by domain)
1.1 Core Commerce
Node: Organization (base not re-listed; referenced by other nodes/edges)

You said “don’t include Organization base,” so I won’t reprint it here (but all outgoing/incoming connections are included below).

Node: Product (base not re-listed; referenced by other nodes/edges)

Same: not repeating base, but all outgoing/incoming are covered below.

Node: PhysicalLocation

Properties

locationId: String

canonicalName: String

locationType: Enum(HEADQUARTERS | REGISTERED_ADDRESS | OFFICE | LAB_FACILITY | CLINIC_SITE | MANUFACTURING_SITE | WAREHOUSE | RETAIL_SITE | DATA_CENTER | RESEARCH_SITE | COLLECTION_SITE | CONFERENCE_VENUE | OTHER)

addressLine1: String | null

addressLine2: String | null (schema includes; you listed only line1, but keep line2) 

neo4j_knowledge_graph_graphql_s…

city: String | null

region: String | null

postalCode: String | null

countryCode: String | null

geoLat: Float | null (schema uses geoLat/geoLon) 

neo4j_knowledge_graph_graphql_s…

geoLon: Float | null

timezone: String | null

jurisdiction: String | null (schema includes; useful for regulatory location inference) 

neo4j_knowledge_graph_graphql_s…

placeTags: [String] | null

hoursOfOperation: String | null

contactPhone: String | null

contactEmail: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing (optional per your note)

(optional) LISTS -> Listing (only if a location truly originates a listing; schema does not currently model this edge explicitly in the commerce set — see relationship section)

Incoming

HAS_LOCATION <- Organization

AVAILABLE_IN <- Listing

Node: ProductCategory

Properties

categoryId: String

name: String

description: String | null

aliases: [String] | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Incoming

IN_CATEGORY <- Product

Node: Listing

Properties

listingId: String

listingDomain: Enum(DIAGNOSTICS | SUPPLEMENT | DEVICE | TELEHEALTH | SOFTWARE | SERVICE | OTHER)

title: String

description: String | null

sku: String | null

url: String | null

brandName: String | null

currency: String

priceAmount: Float | null

priceType: Enum(LIST | PROMO | MEMBER_ONLY | INSURANCE_ESTIMATE | UNKNOWN) | null

pricingNotes: String | null

constraints: String | null (schema field; you called it pricing/availability notes—keep as flat text) 

neo4j_knowledge_graph_graphql_s…

regionsAvailable: [String] | null

requiresAppointment: Boolean | null

collectionMode: Enum(AT_HOME_KIT | IN_PERSON_DRAW | MOBILE_PHLEBOTOMY | IN_CLINIC | SHIPPING | TELEHEALTH | VIRTUAL | OTHER) | null 

neo4j_knowledge_graph_graphql_s…

turnaroundTime: String | null

capturedAt: DateTime (you require; schema doesn’t currently show it on Listing; add it—this is key for commerce snapshots)

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing

LISTS_PRODUCT -> Product

AVAILABLE_IN -> PhysicalLocation

HAS_SNAPSHOT -> ListingSnapshot

IMPLEMENTS_PANEL -> PanelDefinition (optional; listing-specific bundle)

Incoming

LISTS <- Organization

Rule enforcement

✅ No Listing -> LabTest edges (as you stated)

Node: ListingSnapshot

(Not currently in schema excerpt, but you want it. Treat as terminal snapshot node.)

Properties (recommended, minimal but powerful for commerce)

listingSnapshotId: String

capturedAt: DateTime (required)

sourceUrl: String | null

snapshotTitle: String | null

snapshotDescription: String | null

snapshotCurrency: String | null

snapshotPriceAmount: Float | null

snapshotPriceType: String | null

snapshotAvailabilityNotes: String | null

snapshotRawText: String | null (optional: powerful for debugging + re-extraction; keep as String not JSON)

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

HAS_SNAPSHOT <- Listing

1.2 Technology + Capability
Node: TechnologyPlatform

Properties

platformId: String

canonicalName: String

aliases: [String] | null

platformType: Enum(THERAPEUTIC_PLATFORM | DIAGNOSTIC_PLATFORM | MANUFACTURING_PLATFORM | MODALITY_PLATFORM | ANALYTICS_PLATFORM | OTHER)

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Incoming

IMPLEMENTS <- Product (your desired “Product implements platform”; schema currently has ProductUsesPlatformEdge; see rel mapping)

USES_PLATFORM <- Organization

USES_PLATFORM <- Product

USES_PLATFORM <- LabTest (optional)

USES_PLATFORM <- ManufacturingStep (optional/high-value)

DEVELOPS_PLATFORM <- Organization

RUNS_ON_PLATFORM <- MeasurementMethod

IMPLEMENTS_PLATFORM <- Device (optional)

Node: ToolOrInstrument

(Not present in schema excerpt; you want it.)

Properties (search-friendly standard)

toolOrInstrumentId: String

canonicalName: String

aliases: [String] | null

toolType: String | null (e.g., “centrifuge”, “PCR machine”, “HPLC”)

manufacturerName: String | null

modelNumber: String | null

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

IS_A <- Product

USES <- Organization

USES_EQUIPMENT <- ManufacturingStep

1.3 Manufacturing
Node: ManufacturingProcess

Properties

manufacturingProcessId: String

canonicalName: String

processType: Enum(chemical_synthesis | fermentation | extraction | semi_synthesis | formulation | assembly | packaging | qc_release | other) 

neo4j_knowledge_graph_graphql_s…

description: String | null

inputs: [String] | null (schema stores string lists; you also model Material/CompoundForm edges—keep both if ingestion is messy) 

neo4j_knowledge_graph_graphql_s…

outputs: [String] | null

qualityRisks: [String] | null

scalabilityLevel: Enum(lab | pilot | commercial | unknown) | null 

neo4j_knowledge_graph_graphql_s…

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Outgoing (your desired)

HAS_STEP -> ManufacturingStep

INPUTS -> Material | CompoundForm

OUTPUTS -> Material | CompoundForm

PRODUCES -> Material | CompoundForm

Incoming

PERFORMS_MANUFACTURING_PROCESS <- Organization

HOSTS_MANUFACTURING_PROCESS <- ManufacturingSite | PhysicalLocation

Node: ManufacturingStep

(Not present in schema excerpt; you want it.)

Properties (minimal but high-value)

manufacturingStepId: String

canonicalName: String

stepType: String | null (e.g., “lysis”, “centrifugation”, “chromatography”, “fill-finish”)

sequenceIndex: Int | null

description: String | null

qcGate: Boolean | null

parametersNotes: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing

USES_PLATFORM -> TechnologyPlatform

USES_EQUIPMENT -> ToolOrInstrument

HAS_INPUT -> Material | CompoundForm

HAS_OUTPUT -> Material | CompoundForm

Incoming

HAS_STEP <- ManufacturingProcess

Node: Material

(Not present in schema excerpt; you want it. Use as “stuff/ingredient/intermediate”.)

Properties (search-friendly)

materialId: String

canonicalName: String

aliases: [String] | null

materialType: String | null (raw, intermediate, reagent, packaging, etc.)

grade: String | null (GMP, research grade, etc.)

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing

PART_OF -> Product

USED_IN -> ManufacturingProcess

PRODUCED_VIA -> ManufacturingProcess

Incoming

INPUTS <- ManufacturingProcess

OUTPUTS <- ManufacturingProcess

PRODUCES <- ManufacturingProcess

HAS_INPUT <- ManufacturingStep

HAS_OUTPUT <- ManufacturingStep

Node: ManufacturingSite (optional; can reuse PhysicalLocation)

If separate from PhysicalLocation:

Properties

manufacturingSiteId: String

canonicalName: String

siteType: String | null

certifications: [String] | null (GMP, ISO, etc.)

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing

HOSTS_MANUFACTURING_PROCESS -> ManufacturingProcess

Incoming

HAS_LOCATION <- Organization (if you connect org -> location -> site)

1.4 Regulatory
Node: Jurisdiction

(Not in schema excerpt; you want it.)

Properties

jurisdictionId: String

canonicalName: String (e.g., “United States”, “EU”, “California”)

jurisdictionType: String | null (country/state/region)

authorityNotes: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

IN_JURISDICTION <- RegulatoryPathway

IN_JURISDICTION <- RegulatoryStatus

Node: RegulatoryPathway

Properties

pathwayId: String

authority: String

pathwayType: String

pathwayName: String

requirementsSummary: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Outgoing

HAS_REGULATORY_STEP -> RegulatoryStep

IN_JURISDICTION -> Jurisdiction

Incoming

FOLLOWS_PATHWAY <- Product

OVERSEES <- RegulatoryAgency (optional)

Node: RegulatoryStep

(Not in schema excerpt; you want it.)

Properties

regulatoryStepId: String

canonicalName: String

stepType: String | null (submission, review, clearance, etc.)

description: String | null

sequenceIndex: Int | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

HAS_REGULATORY_STEP <- RegulatoryPathway

Node: RegulatoryStatus

Properties

regulatoryStatusId: String

status: String | null

effectiveDate: DateTime | null

statusDetails: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Outgoing

IN_JURISDICTION -> Jurisdiction

ISSUED_BY -> RegulatoryAgency (optional)

Incoming

HAS_REGULATORY_STATUS <- Product

Node: RegulatoryAgency (optional)

Properties

regulatoryAgencyId: String

canonicalName: String

aliases: [String] | null

agencyType: String | null

websiteUrl: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing

OVERSEES -> RegulatoryPathway (optional)

Incoming

ISSUED_BY <- RegulatoryStatus

1.5 Analytics / Lab / Panels / Biomarkers
Node: PanelDefinition

Properties

panelDefinitionId: String

canonicalName: String

aliases: [String] | null

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Outgoing

INCLUDES_LABTEST -> LabTest

INCLUDES_BIOMARKER -> Biomarker (optional convenience)

Incoming

IMPLEMENTS_PANEL <- Product

IMPLEMENTS_PANEL <- Listing (optional)

Node: LabTest

Properties

labTestId: String

name: String

synonyms: [String] | null

loincCodes: [String] | null

cptCodes: [String] | null

whatItMeasures: String | null

prepRequirements: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt 

neo4j_knowledge_graph_graphql_s…

Outgoing

MEASURES -> Biomarker

USES_METHOD -> MeasurementMethod

REQUIRES_SPECIMEN -> Specimen

USES_PLATFORM -> TechnologyPlatform (optional)

Incoming

INCLUDES_LABTEST <- PanelDefinition

DELIVERS_LABTEST <- Product

Node: Biomarker

(Not in schema excerpt; you want it.)

Properties

biomarkerId: String

name: String

synonyms: [String] | null

description: String | null

clinicalDomains: [String] | null

unitsCommon: [String] | null

interpretationNotes: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

MEASURES <- LabTest

INCLUDES_BIOMARKER <- PanelDefinition (optional)

Node: MeasurementMethod

(Not in schema excerpt; you want it. Note: schema has RUNS_ON_PLATFORM relation in your desired set but doesn’t define the node in excerpt.)

Properties

methodId: String

canonicalName: String

methodFamily: String

analyticPrinciple: String | null

typicalCvPercentMin: Float | null

typicalCvPercentMax: Float | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Outgoing

RUNS_ON_PLATFORM -> TechnologyPlatform

Incoming

USES_METHOD <- LabTest

Node: Specimen

(Not in schema excerpt; you want it.)

Properties

specimenId: String

canonicalName: String

specimenType: String

matrix: String | null

biologicalDomain: String

collectionContextCategory: String

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

REQUIRES_SPECIMEN <- LabTest

1.6 Compounds / Mechanisms / Value Chain
Node: CompoundForm

Properties

compoundFormId: String

canonicalName: String

formType: String

chemicalDifferences: String | null 

neo4j_knowledge_graph_graphql_s…

stabilityProfile: String | null

solubilityProfile: String | null

bioavailabilityNotes: String | null

regulatoryStatusSummary: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

CONTAINS_COMPOUND_FORM <- Product

MANUFACTURES <- Organization (you want it; schema has ManufacturesEdge to CompoundForm) 

neo4j_knowledge_graph_graphql_s…

Node: Compound

(Not in schema excerpt; you want it.)

Properties

compoundId: String

canonicalName: String

aliases: [String] | null

chemicalClass: String | null

endogenous: Boolean | null

molecularWeight: Float | null

description: String | null

mechanismRole: String | null

compoundClass: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

IS_FORM_OF <- CompoundForm (your relationship is CompoundForm -> Compound; see relationship section)

Node: Mechanism

(Not in schema excerpt; you want it.)

Properties

mechanismId: String

canonicalName: String

mechanismType: String

biologicalDomain: String

functionalDomain: String

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

INDICATES_MECHANISM <- Biomarker

AFFECTS_MECHANISM <- CompoundForm

Node: ValueChainStage

(Not in schema excerpt; you want it.)

Properties

stageId: String

canonicalName: String

level: Int

stageType: String

definition: String

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Incoming

OPERATES_IN_STAGE <- Organization

2) Relationships (type names, direction, properties)
2.1 Relationship property defaults (applies to ALL below)

createdAt: DateTime

updatedAt: DateTime (recommended standardization)

validAt: DateTime | null

invalidAt: DateTime | null

expiredAt: DateTime | null

claimIds: [String] | null (where present in schema / dumps)

Optional provenance additions (if you want): source, provenanceRunId, extractorVersion, extractedAt, etc.

2.2 Core Commerce relationships
(Organization)-[:LISTS]->(Listing)

Properties

listRole: Enum(OPERATOR | PROVIDER | SELLER | DISTRIBUTOR | MARKETER | FULFILLMENT_PARTNER | BILLING_ENTITY | OTHER) 

neo4j_knowledge_graph_graphql_s…

channel: Enum(ONLINE | IN_PERSON | PHONE | PARTNER | MARKETPLACE | OTHER) | null 

neo4j_knowledge_graph_graphql_s…

regionsOverrides: [String] | null

collectionModesOverrides: [String] | null

availabilityNotes: String | null

claimIds: [String] (schema has required list; you can treat as optional in ontology and require at ingestion time) 

neo4j_knowledge_graph_graphql_s…

lifecycle fields

Schema mapping

Edge type: ListsEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:HAS_LOCATION]->(PhysicalLocation)

Properties

locationRole: String (schema requires String) 

neo4j_knowledge_graph_graphql_s…

isPrimary: Boolean | null

startDate: DateTime | null

endDate: DateTime | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: HasLocationEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:OWNS_OR_CONTROLS]->(Organization)

Properties

relationshipType: String

ownershipPercent: Float | null

controlType: String | null

effectiveFrom: DateTime | null

effectiveTo: DateTime | null

isCurrent: Boolean | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: OwnsOrControlsEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:MANUFACTURES_PRODUCT]->(Product)

Properties

claimIds: [String] | null

lifecycle fields

Schema mapping

Edge type in schema: ManufacturesProductEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:PERFORMS_MANUFACTURING_PROCESS]->(ManufacturingProcess)

Properties

role: Enum(primary | subcontractor | cdmo | cmo | api_supplier | other) 

neo4j_knowledge_graph_graphql_s…

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: PerformsManufacturingProcessEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(Organization)

Properties

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: ContractManufacturerForOrganizationEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(Product) (optional)

Properties

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: ContractManufacturerForProductEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:DEVELOPS_PLATFORM]->(TechnologyPlatform)

Properties

relationshipRole: Enum(PRIMARY_DEVELOPER | CO_DEVELOPER | MAINTAINER | STEWARD | UNKNOWN) | null 

neo4j_knowledge_graph_graphql_s…

notes: String | null

source: Enum(CURATED | IMPORTED | DERIVED) | null 

neo4j_knowledge_graph_graphql_s…

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: DevelopsPlatformEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:USES_PLATFORM]->(TechnologyPlatform)

Properties

usageContext: Enum(R_AND_D | PRODUCTION | QC | CLINICAL | ANALYTICS | OTHER | UNKNOWN) | null 

neo4j_knowledge_graph_graphql_s…

isPrimary: Boolean | null

notes: String | null

source: Enum(CURATED | IMPORTED | DERIVED) | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: UsesPlatformEdge 

neo4j_knowledge_graph_graphql_s…

(Organization)-[:USES]->(ToolOrInstrument)

Properties

usageContext: String | null

isPrimary: Boolean | null

notes: String | null

claimIds: [String] | null

lifecycle fields

Schema mapping

Not defined in schema excerpt; this is a new edge you’re adding.

(Organization)-[:OPERATES_IN_STAGE]->(ValueChainStage)

Properties

primary: Boolean | null

scope: String | null

claimIds: [String] | null

lifecycle fields

Schema mapping

Not in schema excerpt; new edge.

2.3 Product relationships (Commerce + Lab + Regulatory + Platform)
(Product)-[:IN_CATEGORY]->(ProductCategory)

Properties

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: InCategoryEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:MADE_BY]->(Organization)

You want MADE_BY, but schema currently uses manufacturedBy and edge type ManufacturedByEdge.

Properties

claimIds: [String]

lifecycle fields

Schema mapping

ALIAS OF MANUFACTURED_BY

Edge type: ManufacturedByEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:IMPLEMENTS]->(TechnologyPlatform)

You want IMPLEMENTS, but schema uses usesPlatform on Product with edge type ProductUsesPlatformEdge. 

neo4j_knowledge_graph_graphql_s…

Properties

claimIds: [String]

lifecycle fields

Schema mapping

ALIAS OF USES_PLATFORM (product-side)

Edge type: ProductUsesPlatformEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:IS_A]->(ToolOrInstrument)

Properties

classificationNotes: String | null

claimIds: [String] | null

lifecycle fields

Schema mapping

Not in schema excerpt; new edge.

(Product)-[:IMPLEMENTS_PANEL]->(PanelDefinition)

Properties

panelRole: Enum(primary | variant | legacy) | null 

neo4j_knowledge_graph_graphql_s…

versionLabel: String | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: ImplementsPanelEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:DELIVERS_LABTEST]->(LabTest)

Properties

role: Enum(primary | component | reflex | add_on | eligibility_gate) 

neo4j_knowledge_graph_graphql_s…

quantity: Int | null

componentName: String | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: DeliversLabTestEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:FOLLOWS_PATHWAY]->(RegulatoryPathway)

Properties

jurisdictionId: String | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: FollowsPathwayEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:HAS_REGULATORY_STATUS]->(RegulatoryStatus)

Properties

status: String | null

effectiveDate: DateTime | null

statusDetails: String | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: HasRegulatoryStatusEdge 

neo4j_knowledge_graph_graphql_s…

(Product)-[:LISTS_PRODUCT] <- (Listing)

See Listing section (same edge).

(Product)-[:PART_OF] <- (Material)

New edge (not in schema excerpt).

Properties

role: String | null (ingredient/component/packaging/etc.)

quantity: Float | null

unit: String | null

claimIds: [String] | null

lifecycle fields

(Organization)-[:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(Product) (optional incoming to Product)

Already defined above.

2.4 Listing relationships
(Listing)-[:LISTS_PRODUCT]->(Product)

Properties

claimIds: [String]

lifecycle fields

Schema mapping

Not shown as explicit edge type in excerpt, but implied as a relationship pattern in your dump notes; in schema, Listing is a node, but edges are modeled on Organization and Product.
If you want Listing→Product explicitly, add a ListsProductEdge or model it via your ingestion layer. (You already treat it as required in your ontology.)

(Listing)-[:AVAILABLE_IN]->(PhysicalLocation)

Properties

claimIds: [String]

lifecycle fields

Schema mapping

Not shown as explicit edge type in excerpt. Add AvailableInEdge if you want edge-level props.

(Listing)-[:HAS_SNAPSHOT]->(ListingSnapshot)

Properties

claimIds: [String] | null

lifecycle fields

Schema mapping

New

(Listing)-[:IMPLEMENTS_PANEL]->(PanelDefinition) (optional)

Properties

claimIds: [String] | null

lifecycle fields

Schema mapping

New (schema has Product implements panel; listing variant is extra)

2.5 Panel / Lab relationships
(PanelDefinition)-[:INCLUDES_LABTEST]->(LabTest)

Properties

required: Boolean | null (default true)

quantity: Int | null

notes: String | null

claimIds: [String] | null

lifecycle fields

Schema mapping

Not in schema excerpt; add edge type if you want relationship properties.

(PanelDefinition)-[:INCLUDES_BIOMARKER]->(Biomarker) (optional convenience)

Properties

claimIds: [String] | null

lifecycle fields

Schema mapping

New

(LabTest)-[:MEASURES]->(Biomarker)

Properties

role: Enum(primary | derived | ratio | composite | other) | null

claimIds: [String] | null

lifecycle fields

Schema mapping

New

(LabTest)-[:USES_METHOD]->(MeasurementMethod)

Properties

methodRole: Enum(primary | confirmatory | reflex | backup) | null

claimIds: [String] | null

lifecycle fields

Schema mapping

New

(LabTest)-[:REQUIRES_SPECIMEN]->(Specimen)

Properties

specimenRole: Enum(required | acceptableAlternative | preferred)

Collection constraints (flattened)

collectionSetting: Enum(AT_HOME | CLINIC | LAB | MOBILE_PHLEBOTOMY | HOSPITAL | UNKNOWN) | null

collectionMethod: Enum(VENIPUNCTURE | FINGERSTICK | SALIVA_TUBE | STOOL_KIT | URINE_CUP | SWAB | OTHER | UNKNOWN) | null

fastingRequired: Boolean | null

fastingMinHours: Int | null

fastingMaxHours: Int | null

requiresAppointment: Boolean | null

requiresColdChainDuringCollection: Boolean | null

collectionTimeWindow: Enum(ANYTIME | MORNING_ONLY | TIMED_DRAW | CYCLE_PHASED | OTHER | UNKNOWN) | null

collectionNotes: String | null

Processing constraints (flattened)

processingMustCentrifuge: Boolean | null

processingCentrifugeWithinMinutes: Int | null

processingAliquotRequired: Boolean | null

processingAdditive: Enum(NONE | EDTA | HEPARIN | CITRATE | SST | OTHER | UNKNOWN) | null

processingLightSensitive: Boolean | null

processingMixInversions: Int | null

processingMaxRoomTempMinutes: Int | null

processingNotes: String | null

Stability window (flattened)

stabilityAtRoomTempMaxHours: Int | null

stabilityRefrigeratedMaxHours: Int | null

stabilityFrozenMaxDays: Int | null

stabilityMinTempC: Float | null

stabilityMaxTempC: Float | null

stabilityRequiresColdChain: Boolean | null

stabilityNotes: String | null

Conditions / context (flattened)

populationTags: [String] | null

sex: Enum(ANY | FEMALE | MALE | INTERSEX | UNKNOWN) | null

ageMinYears: Int | null

ageMaxYears: Int | null

measurementState: Enum(FASTING | NON_FASTING | POSTPRANDIAL | RESTING | EXERCISE | SLEEP | ACUTE_ILLNESS | RECOVERY | UNKNOWN) | null

timeOfDay: Enum(MORNING | AFTERNOON | EVENING | NIGHT | UNKNOWN) | null

conditionTags: [String] | null

medicationClassTags: [String] | null

comorbidityTags: [String] | null

appliesWhen: Enum(BASELINE | CHANGE_FROM_BASELINE | THRESHOLD_EXCEEDED | TREND | UNKNOWN) | null

thresholdDirection: Enum(ABOVE | BELOW | BOTH | UNKNOWN) | null

thresholdValue: Float | null

thresholdUnit: String | null

evidenceContextTags: [String] | null

claimIds: [String] | null

lifecycle fields

Schema mapping

New (not in schema excerpt)

2.6 Compound / Mechanism relationships
(Product)-[:CONTAINS_COMPOUND_FORM]->(CompoundForm)

Properties

dose: Float | null

doseUnit: String | null

role: Enum(active | excipient | carrier | other) | null 

neo4j_knowledge_graph_graphql_s…

standardizedTo: String | null

claimIds: [String]

lifecycle fields

Schema mapping

Edge type: ContainsCompoundFormEdge 

neo4j_knowledge_graph_graphql_s…

(CompoundForm)-[:IS_FORM_OF]->(Compound)

Properties

claimIds: [String] | null

lifecycle fields

Schema mapping

New

(Biomarker)-[:INDICATES_MECHANISM]->(Mechanism)

Properties

direction: Enum(high | low | both | changeRate | thresholdCrossing)

associationShape: Enum(monotonic | uShaped | jShaped | invertedU | unknown)

polarity: Enum(supportsActivation | supportsInhibition | supportsDamage | supportsProtection | contextDependent)

populationTags: [String] | null

sex: Enum(ANY | FEMALE | MALE | INTERSEX | UNKNOWN) | null

ageMinYears: Int | null

ageMaxYears: Int | null

measurementState: Enum(FASTING | NON_FASTING | POSTPRANDIAL | RESTING | EXERCISE | SLEEP | ACUTE_ILLNESS | RECOVERY | UNKNOWN) | null

timeOfDay: Enum(MORNING | AFTERNOON | EVENING | NIGHT | UNKNOWN) | null

conditionTags: [String] | null

medicationClassTags: [String] | null

comorbidityTags: [String] | null

appliesWhen: Enum(BASELINE | CHANGE_FROM_BASELINE | THRESHOLD_EXCEEDED | TREND | UNKNOWN) | null

thresholdDirection: Enum(ABOVE | BELOW | BOTH | UNKNOWN) | null

thresholdValue: Float | null

thresholdUnit: String | null

evidenceContextTags: [String] | null

evidenceStrength: Enum(high | medium | low | speculative)

specificity: Enum(high | medium | low)

latency: Enum(acute | subacute | chronic)

timeHorizon: Enum(realTime | weeks | months | longTerm)

notes: String | null

claimIds: [String] | null

lifecycle fields

Schema mapping

New

(CompoundForm)-[:AFFECTS_MECHANISM]->(Mechanism)

Properties

direction: Enum(increases | decreases | modulates | unknown)

evidenceStrength: Enum(high | medium | low | speculative)

populationTags: [String] | null

sex: Enum(ANY | FEMALE | MALE | INTERSEX | UNKNOWN) | null

ageMinYears: Int | null

ageMaxYears: Int | null

measurementState: Enum(FASTING | NON_FASTING | POSTPRANDIAL | RESTING | EXERCISE | SLEEP | ACUTE_ILLNESS | RECOVERY | UNKNOWN) | null

timeOfDay: Enum(MORNING | AFTERNOON | EVENING | NIGHT | UNKNOWN) | null

conditionTags: [String] | null

medicationClassTags: [String] | null

comorbidityTags: [String] | null

appliesWhen: Enum(BASELINE | CHANGE_FROM_BASELINE | THRESHOLD_EXCEEDED | TREND | UNKNOWN) | null

thresholdDirection: Enum(ABOVE | BELOW | BOTH | UNKNOWN) | null

thresholdValue: Float | null

thresholdUnit: String | null

evidenceContextTags: [String] | null

bioavailabilityContext: String | null

notes: String | null

claimIds: [String] | null

lifecycle fields

Schema mapping

New

3) Notes on mismatches + recommended standardization
3.1 Relationship naming mismatches (keep your ontology names, map in API)

Product.MADE_BY → map to MANUFACTURED_BY / ManufacturedByEdge 

neo4j_knowledge_graph_graphql_s…

Product.IMPLEMENTS (platform) → map to USES_PLATFORM / ProductUsesPlatformEdge 

neo4j_knowledge_graph_graphql_s…

3.2 updatedAt standardization

Your must-have list includes updatedAt. The schema excerpt shows updatedAt on ingestion nodes/edges (Document, Chunk, ResearchRunRef, etc.) but domain nodes like Listing/TechnologyPlatform/ProductCategory don’t consistently show updatedAt. Standardize it across all structured domain nodes/edges for consistency. 

neo4j_knowledge_graph_graphql_s…

3.3 ListingSnapshot

You want it; schema excerpt doesn’t have it. It’s worth adding because it enables:

historical pricing/availability diffs

auditability of scraped commerce claims

re-extraction without re-scraping