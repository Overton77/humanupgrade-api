import { LabTestIdentifierKey } from "../types.js";

export function buildLabTestUpsertCypher(identifierKey: LabTestIdentifierKey) {
  return `
    MERGE (lt:LabTest { ${identifierKey}: $idValue })
    ON CREATE SET lt.createdAt = datetime()

    // canonical id must always exist
    SET lt.labTestId = coalesce(lt.labTestId, randomUUID())

    SET lt += {
      name: CASE WHEN $name IS NULL THEN lt.name ELSE $name END,

      synonyms: CASE
        WHEN $synonyms IS NULL THEN lt.synonyms
        ELSE apoc.coll.toSet(coalesce(lt.synonyms, []) + coalesce($synonyms, []))
      END,

      loincCodes: CASE
        WHEN $loincCodes IS NULL THEN lt.loincCodes
        ELSE apoc.coll.toSet(coalesce(lt.loincCodes, []) + coalesce($loincCodes, []))
      END,

      cptCodes: CASE
        WHEN $cptCodes IS NULL THEN lt.cptCodes
        ELSE apoc.coll.toSet(coalesce(lt.cptCodes, []) + coalesce($cptCodes, []))
      END,

      whatItMeasures: CASE WHEN $whatItMeasures IS NULL THEN lt.whatItMeasures ELSE $whatItMeasures END,
      prepRequirements: CASE WHEN $prepRequirements IS NULL THEN lt.prepRequirements ELSE $prepRequirements END,

      validAt: CASE WHEN $validAt IS NULL THEN lt.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN lt.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN lt.expiredAt ELSE $expiredAt END
    }

    RETURN lt
  `;
}

// ==================================================================
// MEASURES (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const labTestMeasuresBiomarkerCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})

UNWIND coalesce($measures, []) AS mbRel
CALL {
  // ---- CREATE branch ----
  WITH lt, mbRel 
  WITH lt, mbRel 
  WHERE mbRel.biomarker.create IS NOT NULL

  MERGE (bm:Biomarker {
    biomarkerId: coalesce(mbRel.biomarker.create.biomarkerId, randomUUID())
  })
  ON CREATE SET bm.createdAt = datetime()

  SET bm += {
    name: CASE WHEN mbRel.biomarker.create.name IS NULL THEN bm.name ELSE mbRel.biomarker.create.name END,
    synonyms: CASE
      WHEN mbRel.biomarker.create.synonyms IS NULL THEN bm.synonyms
      ELSE apoc.coll.toSet(coalesce(bm.synonyms, []) + coalesce(mbRel.biomarker.create.synonyms, []))
    END,
    description: CASE WHEN mbRel.biomarker.create.description IS NULL THEN bm.description ELSE mbRel.biomarker.create.description END,
    clinicalDomains: CASE
      WHEN mbRel.biomarker.create.clinicalDomains IS NULL THEN bm.clinicalDomains
      ELSE apoc.coll.toSet(coalesce(bm.clinicalDomains, []) + coalesce(mbRel.biomarker.create.clinicalDomains, []))
    END,
    unitsCommon: CASE
      WHEN mbRel.biomarker.create.unitsCommon IS NULL THEN bm.unitsCommon
      ELSE apoc.coll.toSet(coalesce(bm.unitsCommon, []) + coalesce(mbRel.biomarker.create.unitsCommon, []))
    END,
    interpretationNotes: CASE WHEN mbRel.biomarker.create.interpretationNotes IS NULL THEN bm.interpretationNotes ELSE mbRel.biomarker.create.interpretationNotes END,
    validAt: CASE WHEN mbRel.biomarker.create.validAt IS NULL THEN bm.validAt ELSE mbRel.biomarker.create.validAt END,
    invalidAt: CASE WHEN mbRel.biomarker.create.invalidAt IS NULL THEN bm.invalidAt ELSE mbRel.biomarker.create.invalidAt END,
    expiredAt: CASE WHEN mbRel.biomarker.create.expiredAt IS NULL THEN bm.expiredAt ELSE mbRel.biomarker.create.expiredAt END
  }

  MERGE (lt)-[r:MEASURES]->(bm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN mbRel.role IS NULL THEN r.role ELSE mbRel.role END,
    claimIds: CASE
      WHEN mbRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mbRel.claimIds, []))
    END,
    createdAt: CASE WHEN mbRel.createdAt IS NULL THEN r.createdAt ELSE mbRel.createdAt END,
    validAt: CASE WHEN mbRel.validAt IS NULL THEN r.validAt ELSE mbRel.validAt END,
    invalidAt: CASE WHEN mbRel.invalidAt IS NULL THEN r.invalidAt ELSE mbRel.invalidAt END,
    expiredAt: CASE WHEN mbRel.expiredAt IS NULL THEN r.expiredAt ELSE mbRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH lt, mbRel 
  WITH lt, mbRel
  WHERE mbRel.biomarker.connect IS NOT NULL

  OPTIONAL MATCH (bm:Biomarker {biomarkerId: mbRel.biomarker.connect.biomarkerId})
  WITH lt, mbRel, bm

  CALL apoc.util.validate(
    bm IS NULL,
    'MEASURES connect failed: Biomarker not found for biomarkerId %s',
    [mbRel.biomarker.connect.biomarkerId]
  )

  MERGE (lt)-[r:MEASURES]->(bm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN mbRel.role IS NULL THEN r.role ELSE mbRel.role END,
    claimIds: CASE
      WHEN mbRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mbRel.claimIds, []))
    END,
    createdAt: CASE WHEN mbRel.createdAt IS NULL THEN r.createdAt ELSE mbRel.createdAt END,
    validAt: CASE WHEN mbRel.validAt IS NULL THEN r.validAt ELSE mbRel.validAt END,
    invalidAt: CASE WHEN mbRel.invalidAt IS NULL THEN r.invalidAt ELSE mbRel.invalidAt END,
    expiredAt: CASE WHEN mbRel.expiredAt IS NULL THEN r.expiredAt ELSE mbRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// USES_METHOD (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const labTestUsesMethodCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})

UNWIND coalesce($usesMethod, []) AS umRel
CALL {
  // ---- CREATE branch ----
  WITH lt, umRel 
  WITH lt, umRel 
  WHERE umRel.measurementMethod.create IS NOT NULL

  MERGE (mm:MeasurementMethod {
    methodId: coalesce(umRel.measurementMethod.create.methodId, randomUUID())
  })
  ON CREATE SET mm.createdAt = datetime()

  SET mm += {
    canonicalName: CASE WHEN umRel.measurementMethod.create.canonicalName IS NULL THEN mm.canonicalName ELSE umRel.measurementMethod.create.canonicalName END,
    methodFamily: CASE WHEN umRel.measurementMethod.create.methodFamily IS NULL THEN mm.methodFamily ELSE umRel.measurementMethod.create.methodFamily END,
    analyticPrinciple: CASE WHEN umRel.measurementMethod.create.analyticPrinciple IS NULL THEN mm.analyticPrinciple ELSE umRel.measurementMethod.create.analyticPrinciple END,
    typicalCvPercentMin: CASE WHEN umRel.measurementMethod.create.typicalCvPercentMin IS NULL THEN mm.typicalCvPercentMin ELSE umRel.measurementMethod.create.typicalCvPercentMin END,
    typicalCvPercentMax: CASE WHEN umRel.measurementMethod.create.typicalCvPercentMax IS NULL THEN mm.typicalCvPercentMax ELSE umRel.measurementMethod.create.typicalCvPercentMax END,
    validAt: CASE WHEN umRel.measurementMethod.create.validAt IS NULL THEN mm.validAt ELSE umRel.measurementMethod.create.validAt END,
    invalidAt: CASE WHEN umRel.measurementMethod.create.invalidAt IS NULL THEN mm.invalidAt ELSE umRel.measurementMethod.create.invalidAt END,
    expiredAt: CASE WHEN umRel.measurementMethod.create.expiredAt IS NULL THEN mm.expiredAt ELSE umRel.measurementMethod.create.expiredAt END
  }

  MERGE (lt)-[r:USES_METHOD]->(mm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    methodRole: CASE WHEN umRel.methodRole IS NULL THEN r.methodRole ELSE umRel.methodRole END,
    claimIds: CASE
      WHEN umRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(umRel.claimIds, []))
    END,
    createdAt: CASE WHEN umRel.createdAt IS NULL THEN r.createdAt ELSE umRel.createdAt END,
    validAt: CASE WHEN umRel.validAt IS NULL THEN r.validAt ELSE umRel.validAt END,
    invalidAt: CASE WHEN umRel.invalidAt IS NULL THEN r.invalidAt ELSE umRel.invalidAt END,
    expiredAt: CASE WHEN umRel.expiredAt IS NULL THEN r.expiredAt ELSE umRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH lt, umRel 
  WITH lt, umRel
  WHERE umRel.measurementMethod.connect IS NOT NULL

  OPTIONAL MATCH (mm:MeasurementMethod {methodId: umRel.measurementMethod.connect.methodId})
  WITH lt, umRel, mm

  CALL apoc.util.validate(
    mm IS NULL,
    'USES_METHOD connect failed: MeasurementMethod not found for methodId %s',
    [umRel.measurementMethod.connect.methodId]
  )

  MERGE (lt)-[r:USES_METHOD]->(mm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    methodRole: CASE WHEN umRel.methodRole IS NULL THEN r.methodRole ELSE umRel.methodRole END,
    claimIds: CASE
      WHEN umRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(umRel.claimIds, []))
    END,
    createdAt: CASE WHEN umRel.createdAt IS NULL THEN r.createdAt ELSE umRel.createdAt END,
    validAt: CASE WHEN umRel.validAt IS NULL THEN r.validAt ELSE umRel.validAt END,
    invalidAt: CASE WHEN umRel.invalidAt IS NULL THEN r.invalidAt ELSE umRel.invalidAt END,
    expiredAt: CASE WHEN umRel.expiredAt IS NULL THEN r.expiredAt ELSE umRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// REQUIRES_SPECIMEN (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const labTestRequiresSpecimenCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})

UNWIND coalesce($requiresSpecimen, []) AS rsRel
CALL {
  // ---- CREATE branch ----
  WITH lt, rsRel 
  WITH lt, rsRel 
  WHERE rsRel.specimen.create IS NOT NULL

  MERGE (s:Specimen {
    specimenId: coalesce(rsRel.specimen.create.specimenId, randomUUID())
  })
  ON CREATE SET s.createdAt = datetime()

  SET s += {
    canonicalName: CASE WHEN rsRel.specimen.create.canonicalName IS NULL THEN s.canonicalName ELSE rsRel.specimen.create.canonicalName END,
    specimenType: CASE WHEN rsRel.specimen.create.specimenType IS NULL THEN s.specimenType ELSE rsRel.specimen.create.specimenType END,
    matrix: CASE WHEN rsRel.specimen.create.matrix IS NULL THEN s.matrix ELSE rsRel.specimen.create.matrix END,
    biologicalDomain: CASE WHEN rsRel.specimen.create.biologicalDomain IS NULL THEN s.biologicalDomain ELSE rsRel.specimen.create.biologicalDomain END,
    collectionContextCategory: CASE WHEN rsRel.specimen.create.collectionContextCategory IS NULL THEN s.collectionContextCategory ELSE rsRel.specimen.create.collectionContextCategory END,
    validAt: CASE WHEN rsRel.specimen.create.validAt IS NULL THEN s.validAt ELSE rsRel.specimen.create.validAt END,
    invalidAt: CASE WHEN rsRel.specimen.create.invalidAt IS NULL THEN s.invalidAt ELSE rsRel.specimen.create.invalidAt END,
    expiredAt: CASE WHEN rsRel.specimen.create.expiredAt IS NULL THEN s.expiredAt ELSE rsRel.specimen.create.expiredAt END
  }

  MERGE (lt)-[r:REQUIRES_SPECIMEN]->(s)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    specimenRole: CASE WHEN rsRel.specimenRole IS NULL THEN r.specimenRole ELSE rsRel.specimenRole END,
    collectionSetting: CASE WHEN rsRel.collectionSetting IS NULL THEN r.collectionSetting ELSE rsRel.collectionSetting END,
    collectionMethod: CASE WHEN rsRel.collectionMethod IS NULL THEN r.collectionMethod ELSE rsRel.collectionMethod END,
    fastingRequired: CASE WHEN rsRel.fastingRequired IS NULL THEN r.fastingRequired ELSE rsRel.fastingRequired END,
    fastingMinHours: CASE WHEN rsRel.fastingMinHours IS NULL THEN r.fastingMinHours ELSE rsRel.fastingMinHours END,
    fastingMaxHours: CASE WHEN rsRel.fastingMaxHours IS NULL THEN r.fastingMaxHours ELSE rsRel.fastingMaxHours END,
    requiresAppointment: CASE WHEN rsRel.requiresAppointment IS NULL THEN r.requiresAppointment ELSE rsRel.requiresAppointment END,
    requiresColdChainDuringCollection: CASE WHEN rsRel.requiresColdChainDuringCollection IS NULL THEN r.requiresColdChainDuringCollection ELSE rsRel.requiresColdChainDuringCollection END,
    collectionTimeWindow: CASE WHEN rsRel.collectionTimeWindow IS NULL THEN r.collectionTimeWindow ELSE rsRel.collectionTimeWindow END,
    collectionNotes: CASE WHEN rsRel.collectionNotes IS NULL THEN r.collectionNotes ELSE rsRel.collectionNotes END,
    processingMustCentrifuge: CASE WHEN rsRel.processingMustCentrifuge IS NULL THEN r.processingMustCentrifuge ELSE rsRel.processingMustCentrifuge END,
    processingCentrifugeWithinMinutes: CASE WHEN rsRel.processingCentrifugeWithinMinutes IS NULL THEN r.processingCentrifugeWithinMinutes ELSE rsRel.processingCentrifugeWithinMinutes END,
    processingAliquotRequired: CASE WHEN rsRel.processingAliquotRequired IS NULL THEN r.processingAliquotRequired ELSE rsRel.processingAliquotRequired END,
    processingAdditive: CASE WHEN rsRel.processingAdditive IS NULL THEN r.processingAdditive ELSE rsRel.processingAdditive END,
    processingLightSensitive: CASE WHEN rsRel.processingLightSensitive IS NULL THEN r.processingLightSensitive ELSE rsRel.processingLightSensitive END,
    processingMixInversions: CASE WHEN rsRel.processingMixInversions IS NULL THEN r.processingMixInversions ELSE rsRel.processingMixInversions END,
    processingMaxRoomTempMinutes: CASE WHEN rsRel.processingMaxRoomTempMinutes IS NULL THEN r.processingMaxRoomTempMinutes ELSE rsRel.processingMaxRoomTempMinutes END,
    processingNotes: CASE WHEN rsRel.processingNotes IS NULL THEN r.processingNotes ELSE rsRel.processingNotes END,
    stabilityAtRoomTempMaxHours: CASE WHEN rsRel.stabilityAtRoomTempMaxHours IS NULL THEN r.stabilityAtRoomTempMaxHours ELSE rsRel.stabilityAtRoomTempMaxHours END,
    stabilityRefrigeratedMaxHours: CASE WHEN rsRel.stabilityRefrigeratedMaxHours IS NULL THEN r.stabilityRefrigeratedMaxHours ELSE rsRel.stabilityRefrigeratedMaxHours END,
    stabilityFrozenMaxDays: CASE WHEN rsRel.stabilityFrozenMaxDays IS NULL THEN r.stabilityFrozenMaxDays ELSE rsRel.stabilityFrozenMaxDays END,
    stabilityMinTempC: CASE WHEN rsRel.stabilityMinTempC IS NULL THEN r.stabilityMinTempC ELSE rsRel.stabilityMinTempC END,
    stabilityMaxTempC: CASE WHEN rsRel.stabilityMaxTempC IS NULL THEN r.stabilityMaxTempC ELSE rsRel.stabilityMaxTempC END,
    stabilityRequiresColdChain: CASE WHEN rsRel.stabilityRequiresColdChain IS NULL THEN r.stabilityRequiresColdChain ELSE rsRel.stabilityRequiresColdChain END,
    stabilityNotes: CASE WHEN rsRel.stabilityNotes IS NULL THEN r.stabilityNotes ELSE rsRel.stabilityNotes END,
    populationTags: CASE
      WHEN rsRel.populationTags IS NULL THEN r.populationTags
      ELSE apoc.coll.toSet(coalesce(r.populationTags, []) + coalesce(rsRel.populationTags, []))
    END,
    sex: CASE WHEN rsRel.sex IS NULL THEN r.sex ELSE rsRel.sex END,
    ageMinYears: CASE WHEN rsRel.ageMinYears IS NULL THEN r.ageMinYears ELSE rsRel.ageMinYears END,
    ageMaxYears: CASE WHEN rsRel.ageMaxYears IS NULL THEN r.ageMaxYears ELSE rsRel.ageMaxYears END,
    measurementState: CASE WHEN rsRel.measurementState IS NULL THEN r.measurementState ELSE rsRel.measurementState END,
    timeOfDay: CASE WHEN rsRel.timeOfDay IS NULL THEN r.timeOfDay ELSE rsRel.timeOfDay END,
    conditionTags: CASE
      WHEN rsRel.conditionTags IS NULL THEN r.conditionTags
      ELSE apoc.coll.toSet(coalesce(r.conditionTags, []) + coalesce(rsRel.conditionTags, []))
    END,
    medicationClassTags: CASE
      WHEN rsRel.medicationClassTags IS NULL THEN r.medicationClassTags
      ELSE apoc.coll.toSet(coalesce(r.medicationClassTags, []) + coalesce(rsRel.medicationClassTags, []))
    END,
    comorbidityTags: CASE
      WHEN rsRel.comorbidityTags IS NULL THEN r.comorbidityTags
      ELSE apoc.coll.toSet(coalesce(r.comorbidityTags, []) + coalesce(rsRel.comorbidityTags, []))
    END,
    appliesWhen: CASE WHEN rsRel.appliesWhen IS NULL THEN r.appliesWhen ELSE rsRel.appliesWhen END,
    thresholdDirection: CASE WHEN rsRel.thresholdDirection IS NULL THEN r.thresholdDirection ELSE rsRel.thresholdDirection END,
    thresholdValue: CASE WHEN rsRel.thresholdValue IS NULL THEN r.thresholdValue ELSE rsRel.thresholdValue END,
    thresholdUnit: CASE WHEN rsRel.thresholdUnit IS NULL THEN r.thresholdUnit ELSE rsRel.thresholdUnit END,
    evidenceContextTags: CASE
      WHEN rsRel.evidenceContextTags IS NULL THEN r.evidenceContextTags
      ELSE apoc.coll.toSet(coalesce(r.evidenceContextTags, []) + coalesce(rsRel.evidenceContextTags, []))
    END,
    claimIds: CASE
      WHEN rsRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rsRel.claimIds, []))
    END,
    createdAt: CASE WHEN rsRel.createdAt IS NULL THEN r.createdAt ELSE rsRel.createdAt END,
    validAt: CASE WHEN rsRel.validAt IS NULL THEN r.validAt ELSE rsRel.validAt END,
    invalidAt: CASE WHEN rsRel.invalidAt IS NULL THEN r.invalidAt ELSE rsRel.invalidAt END,
    expiredAt: CASE WHEN rsRel.expiredAt IS NULL THEN r.expiredAt ELSE rsRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH lt, rsRel 
  WITH lt, rsRel
  WHERE rsRel.specimen.connect IS NOT NULL

  OPTIONAL MATCH (s:Specimen {specimenId: rsRel.specimen.connect.specimenId})
  WITH lt, rsRel, s

  CALL apoc.util.validate(
    s IS NULL,
    'REQUIRES_SPECIMEN connect failed: Specimen not found for specimenId %s',
    [rsRel.specimen.connect.specimenId]
  )

  MERGE (lt)-[r:REQUIRES_SPECIMEN]->(s)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    specimenRole: CASE WHEN rsRel.specimenRole IS NULL THEN r.specimenRole ELSE rsRel.specimenRole END,
    collectionSetting: CASE WHEN rsRel.collectionSetting IS NULL THEN r.collectionSetting ELSE rsRel.collectionSetting END,
    collectionMethod: CASE WHEN rsRel.collectionMethod IS NULL THEN r.collectionMethod ELSE rsRel.collectionMethod END,
    fastingRequired: CASE WHEN rsRel.fastingRequired IS NULL THEN r.fastingRequired ELSE rsRel.fastingRequired END,
    fastingMinHours: CASE WHEN rsRel.fastingMinHours IS NULL THEN r.fastingMinHours ELSE rsRel.fastingMinHours END,
    fastingMaxHours: CASE WHEN rsRel.fastingMaxHours IS NULL THEN r.fastingMaxHours ELSE rsRel.fastingMaxHours END,
    requiresAppointment: CASE WHEN rsRel.requiresAppointment IS NULL THEN r.requiresAppointment ELSE rsRel.requiresAppointment END,
    requiresColdChainDuringCollection: CASE WHEN rsRel.requiresColdChainDuringCollection IS NULL THEN r.requiresColdChainDuringCollection ELSE rsRel.requiresColdChainDuringCollection END,
    collectionTimeWindow: CASE WHEN rsRel.collectionTimeWindow IS NULL THEN r.collectionTimeWindow ELSE rsRel.collectionTimeWindow END,
    collectionNotes: CASE WHEN rsRel.collectionNotes IS NULL THEN r.collectionNotes ELSE rsRel.collectionNotes END,
    processingMustCentrifuge: CASE WHEN rsRel.processingMustCentrifuge IS NULL THEN r.processingMustCentrifuge ELSE rsRel.processingMustCentrifuge END,
    processingCentrifugeWithinMinutes: CASE WHEN rsRel.processingCentrifugeWithinMinutes IS NULL THEN r.processingCentrifugeWithinMinutes ELSE rsRel.processingCentrifugeWithinMinutes END,
    processingAliquotRequired: CASE WHEN rsRel.processingAliquotRequired IS NULL THEN r.processingAliquotRequired ELSE rsRel.processingAliquotRequired END,
    processingAdditive: CASE WHEN rsRel.processingAdditive IS NULL THEN r.processingAdditive ELSE rsRel.processingAdditive END,
    processingLightSensitive: CASE WHEN rsRel.processingLightSensitive IS NULL THEN r.processingLightSensitive ELSE rsRel.processingLightSensitive END,
    processingMixInversions: CASE WHEN rsRel.processingMixInversions IS NULL THEN r.processingMixInversions ELSE rsRel.processingMixInversions END,
    processingMaxRoomTempMinutes: CASE WHEN rsRel.processingMaxRoomTempMinutes IS NULL THEN r.processingMaxRoomTempMinutes ELSE rsRel.processingMaxRoomTempMinutes END,
    processingNotes: CASE WHEN rsRel.processingNotes IS NULL THEN r.processingNotes ELSE rsRel.processingNotes END,
    stabilityAtRoomTempMaxHours: CASE WHEN rsRel.stabilityAtRoomTempMaxHours IS NULL THEN r.stabilityAtRoomTempMaxHours ELSE rsRel.stabilityAtRoomTempMaxHours END,
    stabilityRefrigeratedMaxHours: CASE WHEN rsRel.stabilityRefrigeratedMaxHours IS NULL THEN r.stabilityRefrigeratedMaxHours ELSE rsRel.stabilityRefrigeratedMaxHours END,
    stabilityFrozenMaxDays: CASE WHEN rsRel.stabilityFrozenMaxDays IS NULL THEN r.stabilityFrozenMaxDays ELSE rsRel.stabilityFrozenMaxDays END,
    stabilityMinTempC: CASE WHEN rsRel.stabilityMinTempC IS NULL THEN r.stabilityMinTempC ELSE rsRel.stabilityMinTempC END,
    stabilityMaxTempC: CASE WHEN rsRel.stabilityMaxTempC IS NULL THEN r.stabilityMaxTempC ELSE rsRel.stabilityMaxTempC END,
    stabilityRequiresColdChain: CASE WHEN rsRel.stabilityRequiresColdChain IS NULL THEN r.stabilityRequiresColdChain ELSE rsRel.stabilityRequiresColdChain END,
    stabilityNotes: CASE WHEN rsRel.stabilityNotes IS NULL THEN r.stabilityNotes ELSE rsRel.stabilityNotes END,
    populationTags: CASE
      WHEN rsRel.populationTags IS NULL THEN r.populationTags
      ELSE apoc.coll.toSet(coalesce(r.populationTags, []) + coalesce(rsRel.populationTags, []))
    END,
    sex: CASE WHEN rsRel.sex IS NULL THEN r.sex ELSE rsRel.sex END,
    ageMinYears: CASE WHEN rsRel.ageMinYears IS NULL THEN r.ageMinYears ELSE rsRel.ageMinYears END,
    ageMaxYears: CASE WHEN rsRel.ageMaxYears IS NULL THEN r.ageMaxYears ELSE rsRel.ageMaxYears END,
    measurementState: CASE WHEN rsRel.measurementState IS NULL THEN r.measurementState ELSE rsRel.measurementState END,
    timeOfDay: CASE WHEN rsRel.timeOfDay IS NULL THEN r.timeOfDay ELSE rsRel.timeOfDay END,
    conditionTags: CASE
      WHEN rsRel.conditionTags IS NULL THEN r.conditionTags
      ELSE apoc.coll.toSet(coalesce(r.conditionTags, []) + coalesce(rsRel.conditionTags, []))
    END,
    medicationClassTags: CASE
      WHEN rsRel.medicationClassTags IS NULL THEN r.medicationClassTags
      ELSE apoc.coll.toSet(coalesce(r.medicationClassTags, []) + coalesce(rsRel.medicationClassTags, []))
    END,
    comorbidityTags: CASE
      WHEN rsRel.comorbidityTags IS NULL THEN r.comorbidityTags
      ELSE apoc.coll.toSet(coalesce(r.comorbidityTags, []) + coalesce(rsRel.comorbidityTags, []))
    END,
    appliesWhen: CASE WHEN rsRel.appliesWhen IS NULL THEN r.appliesWhen ELSE rsRel.appliesWhen END,
    thresholdDirection: CASE WHEN rsRel.thresholdDirection IS NULL THEN r.thresholdDirection ELSE rsRel.thresholdDirection END,
    thresholdValue: CASE WHEN rsRel.thresholdValue IS NULL THEN r.thresholdValue ELSE rsRel.thresholdValue END,
    thresholdUnit: CASE WHEN rsRel.thresholdUnit IS NULL THEN r.thresholdUnit ELSE rsRel.thresholdUnit END,
    evidenceContextTags: CASE
      WHEN rsRel.evidenceContextTags IS NULL THEN r.evidenceContextTags
      ELSE apoc.coll.toSet(coalesce(r.evidenceContextTags, []) + coalesce(rsRel.evidenceContextTags, []))
    END,
    claimIds: CASE
      WHEN rsRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rsRel.claimIds, []))
    END,
    createdAt: CASE WHEN rsRel.createdAt IS NULL THEN r.createdAt ELSE rsRel.createdAt END,
    validAt: CASE WHEN rsRel.validAt IS NULL THEN r.validAt ELSE rsRel.validAt END,
    invalidAt: CASE WHEN rsRel.invalidAt IS NULL THEN r.invalidAt ELSE rsRel.invalidAt END,
    expiredAt: CASE WHEN rsRel.expiredAt IS NULL THEN r.expiredAt ELSE rsRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// USES_PLATFORM (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const labTestUsesPlatformCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})

UNWIND coalesce($usesPlatform, []) AS upRel
CALL {
  // ---- CREATE branch ----
  WITH lt, upRel 
  WITH lt, upRel 
  WHERE upRel.technologyPlatform.create IS NOT NULL

  MERGE (tp:TechnologyPlatform {
    platformId: coalesce(upRel.technologyPlatform.create.platformId, randomUUID())
  })
  ON CREATE SET tp.createdAt = datetime()

  SET tp += {
    canonicalName: CASE WHEN upRel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE upRel.technologyPlatform.create.canonicalName END,
    aliases: CASE
      WHEN upRel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
      ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(upRel.technologyPlatform.create.aliases, []))
    END,
    platformType: CASE WHEN upRel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE upRel.technologyPlatform.create.platformType END,
    description: CASE WHEN upRel.technologyPlatform.create.description IS NULL THEN tp.description ELSE upRel.technologyPlatform.create.description END,
    validAt: CASE WHEN upRel.technologyPlatform.create.validAt IS NULL THEN tp.validAt ELSE upRel.technologyPlatform.create.validAt END,
    invalidAt: CASE WHEN upRel.technologyPlatform.create.invalidAt IS NULL THEN tp.invalidAt ELSE upRel.technologyPlatform.create.invalidAt END,
    expiredAt: CASE WHEN upRel.technologyPlatform.create.expiredAt IS NULL THEN tp.expiredAt ELSE upRel.technologyPlatform.create.expiredAt END
  }

  MERGE (lt)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN upRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(upRel.claimIds, []))
    END,
    createdAt: CASE WHEN upRel.createdAt IS NULL THEN r.createdAt ELSE upRel.createdAt END,
    validAt: CASE WHEN upRel.validAt IS NULL THEN r.validAt ELSE upRel.validAt END,
    invalidAt: CASE WHEN upRel.invalidAt IS NULL THEN r.invalidAt ELSE upRel.invalidAt END,
    expiredAt: CASE WHEN upRel.expiredAt IS NULL THEN r.expiredAt ELSE upRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH lt, upRel 
  WITH lt, upRel
  WHERE upRel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp:TechnologyPlatform {platformId: upRel.technologyPlatform.connect.platformId})
  WITH lt, upRel, tp

  CALL apoc.util.validate(
    tp IS NULL,
    'USES_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [upRel.technologyPlatform.connect.platformId]
  )

  MERGE (lt)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN upRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(upRel.claimIds, []))
    END,
    createdAt: CASE WHEN upRel.createdAt IS NULL THEN r.createdAt ELSE upRel.createdAt END,
    validAt: CASE WHEN upRel.validAt IS NULL THEN r.validAt ELSE upRel.validAt END,
    invalidAt: CASE WHEN upRel.invalidAt IS NULL THEN r.invalidAt ELSE upRel.invalidAt END,
    expiredAt: CASE WHEN upRel.expiredAt IS NULL THEN r.expiredAt ELSE upRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnLabTestsCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})
RETURN lt
`;

export const createLabTestStatements = {
  labTestMeasuresBiomarkerCypher,
  labTestUsesMethodCypher,
  labTestRequiresSpecimenCypher,
  labTestUsesPlatformCypher,
  returnLabTestsCypher,
};
