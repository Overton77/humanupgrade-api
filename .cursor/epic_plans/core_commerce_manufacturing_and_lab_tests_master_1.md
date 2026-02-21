Global (for these nodes + their relationships)
Lifecycle fields (all nodes + all relationships)

createdAt: DateTime

updatedAt: DateTime

validAt: DateTime | null

invalidAt: DateTime | null

expiredAt: DateTime | null

Edge provenance (recommended, lightweight)

claimIds: [String] | null

source: Enum(CURATED | IMPORTED | DERIVED) | null

provenanceRunId: String | null (maps to mongoRunId)

provenancePlanId: String | null (maps to mongoPlanId)

extractorVersion: String | null

extractedAt: DateTime | null

notes: String | null

(You can keep provenance heavy on MENTIONS/ABOUT edges in the ingestion layer; this is just the domain-layer minimal set.) 

neo4j_knowledge_graph_graphql_s…

Node: ModalityType

Purpose: Type of non-matter input (energy / behavioral / cognitive).

Properties

modalityTypeId: String (unique)

canonicalName: String

modalityClass: Enum(photonic | acoustic | thermal | electromagnetic | mechanical | gravitational | cognitive | behavioral | chemical | other)

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Relationships
Incoming

INSTANCE_OF <- Modality

Node: Modality

Purpose: Specific modality implementation definition (dose dimensions live here).

Properties (flattened)

modalityId: String (unique)

canonicalName: String

Spectral / frequency / wavelength (flattened)

spectralDomain: Enum(infrared | visible | ultraviolet | other) | null

frequencyMinHz: Float | null

frequencyMaxHz: Float | null

wavelengthMinNm: Float | null

wavelengthMaxNm: Float | null

Intensity (flattened)

intensityMin: Float | null

intensityMax: Float | null

intensityUnit: String | null

Delivery + bio

deliveryMode: Enum(continuous | pulsed | intermittent | patterned | other)

biologicalPenetrationDepth: String | null (keep String because depth varies by tissue/context; can later formalize)

description: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Relationships
Outgoing

INSTANCE_OF -> ModalityType

HAS_PARAMETER -> ModalityParameter

Incoming

USES_MODALITY <- Device

Node: ModalityParameter

Purpose: Canonical “dose parameter” dimensions so modality specs don’t drift.

Properties

parameterId: String (unique)

name: String (e.g., wavelength, frequency, temperature, duration, dutyCycle)

unit: String | null

safeRange: String | null (text now; formalize later if needed)

therapeuticRange: String | null

notes: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Relationships
Incoming

HAS_PARAMETER <- Modality

Node: FunctionalMetric

Purpose: Observed physiological/behavioral metric (neither Mechanism nor Pathway).

Properties

metricId: String (unique)

canonicalName: String

metricType: Enum(physiological | biomechanical | neural | behavioral | metabolic | other)

signalSource: Enum(heart | brain | muscle | skin | blood | movement | respiration | other)

rawOrDerived: Enum(raw | derived)

description: String | null

units: String | null

temporalResolution: String | null (e.g., “1Hz”, “per minute”, “daily”)

sensitivityNotes: String | null

specificityNotes: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Relationships
Incoming

MEASURES_METRIC <- Sensor

MEASURES_METRIC <- Device (optional shortcut per your design)

Node: Sensor

Purpose: Sensing modality within wearables/devices.

Properties

sensorId: String (unique)

canonicalName: String | null (highly recommended for searchability; add even if you didn’t list it)

sensorType: Enum(optical | electrical | thermal | mechanical | chemical | other)

measuredSignals: [String] | null (flattened list, e.g., ["PPG", "ECG", "EDA"])

limitations: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Relationships
Outgoing

MEASURES_METRIC -> FunctionalMetric

Incoming

HAS_SENSOR <- Device

Node: Device (constructed)

Purpose: Physical device class (wearable, lab device, medical device, consumer device) that uses modalities/sensors and may implement a platform.

This is designed to connect cleanly with your existing commerce slice where Product already has device fields like modelNumber, upc, gtin, riskClass and productDomain=DEVICE. 

neo4j_knowledge_graph_graphql_s…


You can keep Device as a separate node or treat some Products as Devices via an optional edge.

Properties (search + industry-grade, all flat)

Identity

deviceId: String (unique)

canonicalName: String

aliases: [String] | null

description: String | null

Classification

deviceDomain: Enum(wearable | lab_device | imaging | therapeutic | diagnostic | monitoring | other) | null

deviceCategory: String | null (free text tag, e.g., “ring”, “CGM”, “EEG headset”)

intendedUse: String | null

Commercial / identifiers (optional but powerful for matching to Products/Listings)

brandName: String | null

manufacturerName: String | null (string; if you want strict graph link use MADE_BY -> Organization instead)

modelNumber: String | null

upc: String | null

gtin: String | null

fccId: String | null

udiDi: String | null (device identifier; keep string)

riskClass: String | null

Performance / constraints

samplingCapabilities: String | null (free text; avoids JSON)

batteryLife: String | null

wearLocation: String | null (wrist, finger, chest, etc.)

dataOutputs: [String] | null (e.g., ["raw_ppg", "hrv", "sleep_stages"])

connectivity: [String] | null (e.g., ["bluetooth", "wifi"])

regulatoryNotes: String | null

Lifecycle: createdAt, updatedAt, validAt, invalidAt, expiredAt

Device Relationships (your slice)
Outgoing

OF_TYPE -> DeviceType

USES_MODALITY -> Modality

HAS_SENSOR -> Sensor

IMPLEMENTS_PLATFORM -> TechnologyPlatform (optional)

MEASURES_METRIC -> FunctionalMetric (optional shortcut)

Incoming

IS_A_DEVICE <- Product (optional; only if you keep Product and Device separate)

Device-related relationship properties

All edges below include lifecycle + provenance defaults (claimIds/source/run linkage) unless stated otherwise.

(Device)-[:OF_TYPE]->(DeviceType)

Properties

claimIds: [String] | null

notes: String | null

lifecycle fields

(Device)-[:USES_MODALITY]->(Modality)

Properties (powerful but still flat)

isPrimary: Boolean | null

usageContext: Enum(therapy | measurement | stimulation | training | other | unknown) | null

notes: String | null

claimIds: [String] | null

lifecycle fields

(Device)-[:HAS_SENSOR]->(Sensor)

Properties

isPrimary: Boolean | null

sensorPlacement: String | null (wrist underside, fingertip, etc.)

notes: String | null

claimIds: [String] | null

lifecycle fields

(Sensor)-[:MEASURES_METRIC]->(FunctionalMetric)

Properties

metricRole: Enum(primary | derived | quality_control | other) | null

calculationNotes: String | null

claimIds: [String] | null

lifecycle fields

(Device)-[:MEASURES_METRIC]->(FunctionalMetric) (optional shortcut)

Properties

metricRole: Enum(primary | derived | quality_control | other) | null

notes: String | null

claimIds: [String] | null

lifecycle fields

(Device)-[:IMPLEMENTS_PLATFORM]->(TechnologyPlatform) (optional)

Properties

integrationType: Enum(native | accessory | software_only | other | unknown) | null

notes: String | null

claimIds: [String] | null

lifecycle fields

(Product)-[:IS_A_DEVICE]->(Device) (optional bridge)

Purpose: allow commerce Product nodes to link to a Device profile when ProductDomain=DEVICE.

Properties

confidence: Float | null (useful if derived)

notes: String | null

claimIds: [String] | null

lifecycle fields