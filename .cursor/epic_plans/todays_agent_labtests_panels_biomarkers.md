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




Relationship Properties related to these: 


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
