Node labels
Device

Meaning: A device model/design (not a specific physical unit), e.g., “Dexcom G7 CGM”, “Illumina NovaSeq 6000”, “Pulse oximeter model X”.

Required properties

deviceId: string (unique)

canonicalName: string

Optional properties

aliases: [string]

description: string

deviceClass: enum (high-level)
Suggested: diagnostic | monitoring | therapeutic | analytical_instrument | surgical | implantable | software_enabled | other

intendedUse: string

version: string

valid_at: datetime, invalid_at: datetime, expired_at: datetime

DeviceType

Meaning: Category/taxonomy class for devices (more stable than specific device models).

Required

deviceTypeId: string (unique)

canonicalName: string

Optional

description: string

deviceTypeFamily: enum
Suggested: wearable | benchtop | handheld | implant | consumable | accessory | other

valid_at, invalid_at

Modality

Meaning: A concrete sensing/actuation modality used by devices (instance-level modality concept), e.g., “optical PPG”, “electrochemical glucose sensing”, “PCR fluorescence detection”.

Required

modalityId: string (unique)

canonicalName: string

Optional

description: string

modalityRole: enum
Suggested: sensing | actuation | delivery | imaging | analysis | other

valid_at, invalid_at

ModalityType

Meaning: A modality taxonomy class, e.g., “optical”, “electrochemical”, “ultrasound”, “electrical”, “magnetic”, “thermal”.

Required

modalityTypeId: string (unique)

canonicalName: string

Optional

description: string

valid_at, invalid_at

ModalityParameter

Meaning: Parameter definition for a modality (template-ish), e.g., wavelength, sampling rate, gain, voltage, reagent volume.

Required

modalityParameterId: string (unique)

canonicalName: string

Optional

description: string

parameterKey: string (machine-friendly key like sampling_rate_hz)

valueType: enum = float | int | string | boolean | enum | range | other

defaultValue: string (store as string for flexibility)

unit: string (UCUM if you want later, but plain string is fine now)

valid_at, invalid_at

Note: Actual configured values belong either on the relationship HAS_PARAMETER or later on a “DeviceConfig” / “DeviceInstance”. For v1, keep it simple.

Sensor

Meaning: A sensor component type used inside a device model, e.g., “photodiode array”, “thermistor”, “electrochemical electrode”, “accelerometer”.

Required

sensorId: string (unique)

canonicalName: string

Optional

aliases: [string]

description: string

sensorType: enum
Suggested: optical | electrochemical | electrical | mechanical | inertial | thermal | pressure | acoustic | imaging | other

valid_at, invalid_at

FunctionalMetric

Meaning: A metric that a sensor/device measures or outputs, e.g., glucose concentration, SpO2, heart rate, temperature, viral load Ct value.

Required

functionalMetricId: string (unique)

canonicalName: string

Optional

aliases: [string]

description: string

metricType: enum = physiological | analytical | device_performance | quality | other

unit: string (e.g., mg/dL, %, bpm, °C, copies/mL)

valueType: enum = float | int | boolean | categorical | string | other

valid_at, invalid_at

Relationships (directions + properties)
Device → Type / Modality / Sensor / Platform / Metric

(d:Device)-[:OF_TYPE]->(dt:DeviceType)

no properties required

(d:Device)-[:USES_MODALITY {purpose:string?, primary:boolean?}]->(m:Modality)

purpose examples: “primary measurement”, “calibration”, “confirmatory”

primary helps when multiple modalities exist

(d:Device)-[:HAS_SENSOR {count:int?, location:string?}]->(s:Sensor)

count for arrays / multiple identical sensors

location examples: “wrist”, “cartridge”, “optical path”

(d:Device)-[:IMPLEMENTS_PLATFORM {notes:string?}]->(tp:TechnologyPlatform) (optional but good)

use when the device is an embodiment of an underlying platform (e.g., “LC-MS/MS”, “PCR”, “LNP delivery tech” in a device context)

(d:Device)-[:MEASURES_METRIC {method:string?, accuracy:string?, rangeMin:float?, rangeMax:float?, unit:string?}]->(fm:FunctionalMetric) (optional shortcut)

This is a convenience edge; the “more grounded” path is via Sensor.

Modality instance → ModalityType and parameters

(m:Modality)-[:INSTANCE_OF]->(mt:ModalityType)

no properties required

(m:Modality)-[:HAS_PARAMETER {value:string?, unit:string?, min:float?, max:float?, notes:string?}]->(mp:ModalityParameter)

This is where you can store configured defaults/ranges without building a full configuration entity yet.

Sensor → FunctionalMetric

(s:Sensor)-[:MEASURES_METRIC {signalType:string?, unit:string?, samplingRateHz:float?, notes:string?}]->(fm:FunctionalMetric)

signalType examples: “voltage”, “fluorescence intensity”, “count rate”, “impedance”

samplingRateHz optional but often useful

Product linkage (because “Devices do relate to Products”)

You have two clean options; pick one and be consistent:

Option A (recommended): keep Product as the commercial wrapper
9A) (p:Product)-[:IS_A_DEVICE]->(d:Device)

optional properties: {sku:string?, region:string?, startAt:datetime?, endAt:datetime?}

This keeps “Device model” distinct from “SKU/product offering” (which can vary by region, packaging, software bundle, etc.).
