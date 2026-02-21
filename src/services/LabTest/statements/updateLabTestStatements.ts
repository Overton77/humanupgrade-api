import { LabTestIdentifierKey } from "../types.js";

export function buildLabTestUpdateCypher(identifierKey: LabTestIdentifierKey) {
  return `
    OPTIONAL MATCH (lt:LabTest { ${identifierKey}: $idValue })
    CALL apoc.util.validate(
      lt IS NULL,
      'updateLabTest failed: LabTest not found for ${identifierKey} %s',
      [$idValue]
    )

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
// MEASURES (create / connect / update)
// ==================================================================
export const updateLabTestMeasuresBiomarkerCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})
UNWIND $measures AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.biomarker.create IS NOT NULL

  MERGE (bm:Biomarker { biomarkerId: coalesce(rel.biomarker.create.biomarkerId, randomUUID()) })
  ON CREATE SET bm.createdAt = datetime()

  SET bm += {
    name: CASE WHEN rel.biomarker.create.name IS NULL THEN bm.name ELSE rel.biomarker.create.name END,
    synonyms: CASE
      WHEN rel.biomarker.create.synonyms IS NULL THEN bm.synonyms
      ELSE apoc.coll.toSet(coalesce(bm.synonyms, []) + coalesce(rel.biomarker.create.synonyms, []))
    END,
    description: CASE WHEN rel.biomarker.create.description IS NULL THEN bm.description ELSE rel.biomarker.create.description END,
    clinicalDomains: CASE
      WHEN rel.biomarker.create.clinicalDomains IS NULL THEN bm.clinicalDomains
      ELSE apoc.coll.toSet(coalesce(bm.clinicalDomains, []) + coalesce(rel.biomarker.create.clinicalDomains, []))
    END,
    unitsCommon: CASE
      WHEN rel.biomarker.create.unitsCommon IS NULL THEN bm.unitsCommon
      ELSE apoc.coll.toSet(coalesce(bm.unitsCommon, []) + coalesce(rel.biomarker.create.unitsCommon, []))
    END,
    interpretationNotes: CASE WHEN rel.biomarker.create.interpretationNotes IS NULL THEN bm.interpretationNotes ELSE rel.biomarker.create.interpretationNotes END,
    validAt: CASE WHEN rel.biomarker.create.validAt IS NULL THEN bm.validAt ELSE rel.biomarker.create.validAt END,
    invalidAt: CASE WHEN rel.biomarker.create.invalidAt IS NULL THEN bm.invalidAt ELSE rel.biomarker.create.invalidAt END,
    expiredAt: CASE WHEN rel.biomarker.create.expiredAt IS NULL THEN bm.expiredAt ELSE rel.biomarker.create.expiredAt END
  }

  MERGE (lt)-[r:MEASURES]->(bm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN rel.role IS NULL THEN r.role ELSE rel.role END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okMB

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.biomarker.connect IS NOT NULL

  OPTIONAL MATCH (bm2:Biomarker {biomarkerId: rel.biomarker.connect.biomarkerId})
  CALL apoc.util.validate(
    bm2 IS NULL,
    'MEASURES connect failed: Biomarker not found for biomarkerId %s',
    [rel.biomarker.connect.biomarkerId]
  )

  MERGE (lt)-[r2:MEASURES]->(bm2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    role: CASE WHEN rel.role IS NULL THEN r2.role ELSE rel.role END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okMB

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.biomarker.update IS NOT NULL

  CALL apoc.util.validate(
    rel.biomarker.update.biomarkerId IS NULL,
    'MEASURES update failed: biomarker.update.biomarkerId is required',
    []
  )

  OPTIONAL MATCH (bm3:Biomarker {biomarkerId: rel.biomarker.update.biomarkerId})
  OPTIONAL MATCH (lt)-[r3:MEASURES]->(bm3)

  CALL apoc.util.validate(
    bm3 IS NULL,
    'MEASURES update failed: Biomarker not found for biomarkerId %s',
    [rel.biomarker.update.biomarkerId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'MEASURES update failed: MEASURES relationship not found for labTest %s -> biomarker %s',
    [$labTestId, rel.biomarker.update.biomarkerId]
  )

  SET bm3 += {
    name: CASE WHEN rel.biomarker.update.name IS NULL THEN bm3.name ELSE rel.biomarker.update.name END,
    synonyms: CASE
      WHEN rel.biomarker.update.synonyms IS NULL THEN bm3.synonyms
      ELSE apoc.coll.toSet(coalesce(bm3.synonyms, []) + coalesce(rel.biomarker.update.synonyms, []))
    END,
    description: CASE WHEN rel.biomarker.update.description IS NULL THEN bm3.description ELSE rel.biomarker.update.description END,
    clinicalDomains: CASE
      WHEN rel.biomarker.update.clinicalDomains IS NULL THEN bm3.clinicalDomains
      ELSE apoc.coll.toSet(coalesce(bm3.clinicalDomains, []) + coalesce(rel.biomarker.update.clinicalDomains, []))
    END,
    unitsCommon: CASE
      WHEN rel.biomarker.update.unitsCommon IS NULL THEN bm3.unitsCommon
      ELSE apoc.coll.toSet(coalesce(bm3.unitsCommon, []) + coalesce(rel.biomarker.update.unitsCommon, []))
    END,
    interpretationNotes: CASE WHEN rel.biomarker.update.interpretationNotes IS NULL THEN bm3.interpretationNotes ELSE rel.biomarker.update.interpretationNotes END,
    validAt: CASE WHEN rel.biomarker.update.validAt IS NULL THEN bm3.validAt ELSE rel.biomarker.update.validAt END,
    invalidAt: CASE WHEN rel.biomarker.update.invalidAt IS NULL THEN bm3.invalidAt ELSE rel.biomarker.update.invalidAt END,
    expiredAt: CASE WHEN rel.biomarker.update.expiredAt IS NULL THEN bm3.expiredAt ELSE rel.biomarker.update.expiredAt END
  }

  SET r3 += {
    role: CASE WHEN rel.role IS NULL THEN r3.role ELSE rel.role END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okMB
}
RETURN count(*) AS _measuresProcessed
`;

// ==================================================================
// USES_METHOD (create / connect / update)
// ==================================================================
export const updateLabTestUsesMethodCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})
UNWIND $usesMethod AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.measurementMethod.create IS NOT NULL

  MERGE (mm:MeasurementMethod { methodId: coalesce(rel.measurementMethod.create.methodId, randomUUID()) })
  ON CREATE SET mm.createdAt = datetime()

  SET mm += {
    canonicalName: CASE WHEN rel.measurementMethod.create.canonicalName IS NULL THEN mm.canonicalName ELSE rel.measurementMethod.create.canonicalName END,
    methodFamily: CASE WHEN rel.measurementMethod.create.methodFamily IS NULL THEN mm.methodFamily ELSE rel.measurementMethod.create.methodFamily END,
    analyticPrinciple: CASE WHEN rel.measurementMethod.create.analyticPrinciple IS NULL THEN mm.analyticPrinciple ELSE rel.measurementMethod.create.analyticPrinciple END,
    typicalCvPercentMin: CASE WHEN rel.measurementMethod.create.typicalCvPercentMin IS NULL THEN mm.typicalCvPercentMin ELSE rel.measurementMethod.create.typicalCvPercentMin END,
    typicalCvPercentMax: CASE WHEN rel.measurementMethod.create.typicalCvPercentMax IS NULL THEN mm.typicalCvPercentMax ELSE rel.measurementMethod.create.typicalCvPercentMax END,
    validAt: CASE WHEN rel.measurementMethod.create.validAt IS NULL THEN mm.validAt ELSE rel.measurementMethod.create.validAt END,
    invalidAt: CASE WHEN rel.measurementMethod.create.invalidAt IS NULL THEN mm.invalidAt ELSE rel.measurementMethod.create.invalidAt END,
    expiredAt: CASE WHEN rel.measurementMethod.create.expiredAt IS NULL THEN mm.expiredAt ELSE rel.measurementMethod.create.expiredAt END
  }

  MERGE (lt)-[r:USES_METHOD]->(mm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    methodRole: CASE WHEN rel.methodRole IS NULL THEN r.methodRole ELSE rel.methodRole END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okUM

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.measurementMethod.connect IS NOT NULL

  OPTIONAL MATCH (mm2:MeasurementMethod {methodId: rel.measurementMethod.connect.methodId})
  CALL apoc.util.validate(
    mm2 IS NULL,
    'USES_METHOD connect failed: MeasurementMethod not found for methodId %s',
    [rel.measurementMethod.connect.methodId]
  )

  MERGE (lt)-[r2:USES_METHOD]->(mm2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    methodRole: CASE WHEN rel.methodRole IS NULL THEN r2.methodRole ELSE rel.methodRole END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okUM

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.measurementMethod.update IS NOT NULL

  CALL apoc.util.validate(
    rel.measurementMethod.update.methodId IS NULL,
    'USES_METHOD update failed: measurementMethod.update.methodId is required',
    []
  )

  OPTIONAL MATCH (mm3:MeasurementMethod {methodId: rel.measurementMethod.update.methodId})
  OPTIONAL MATCH (lt)-[r3:USES_METHOD]->(mm3)

  CALL apoc.util.validate(
    mm3 IS NULL,
    'USES_METHOD update failed: MeasurementMethod not found for methodId %s',
    [rel.measurementMethod.update.methodId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'USES_METHOD update failed: USES_METHOD relationship not found for labTest %s -> measurementMethod %s',
    [$labTestId, rel.measurementMethod.update.methodId]
  )

  SET mm3 += {
    canonicalName: CASE WHEN rel.measurementMethod.update.canonicalName IS NULL THEN mm3.canonicalName ELSE rel.measurementMethod.update.canonicalName END,
    methodFamily: CASE WHEN rel.measurementMethod.update.methodFamily IS NULL THEN mm3.methodFamily ELSE rel.measurementMethod.update.methodFamily END,
    analyticPrinciple: CASE WHEN rel.measurementMethod.update.analyticPrinciple IS NULL THEN mm3.analyticPrinciple ELSE rel.measurementMethod.update.analyticPrinciple END,
    typicalCvPercentMin: CASE WHEN rel.measurementMethod.update.typicalCvPercentMin IS NULL THEN mm3.typicalCvPercentMin ELSE rel.measurementMethod.update.typicalCvPercentMin END,
    typicalCvPercentMax: CASE WHEN rel.measurementMethod.update.typicalCvPercentMax IS NULL THEN mm3.typicalCvPercentMax ELSE rel.measurementMethod.update.typicalCvPercentMax END,
    validAt: CASE WHEN rel.measurementMethod.update.validAt IS NULL THEN mm3.validAt ELSE rel.measurementMethod.update.validAt END,
    invalidAt: CASE WHEN rel.measurementMethod.update.invalidAt IS NULL THEN mm3.invalidAt ELSE rel.measurementMethod.update.invalidAt END,
    expiredAt: CASE WHEN rel.measurementMethod.update.expiredAt IS NULL THEN mm3.expiredAt ELSE rel.measurementMethod.update.expiredAt END
  }

  SET r3 += {
    methodRole: CASE WHEN rel.methodRole IS NULL THEN r3.methodRole ELSE rel.methodRole END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okUM
}
RETURN count(*) AS _usesMethodProcessed
`;

// ==================================================================
// REQUIRES_SPECIMEN (create / connect / update)
// ==================================================================
export const updateLabTestRequiresSpecimenCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})
UNWIND $requiresSpecimen AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.specimen.create IS NOT NULL

  MERGE (s:Specimen { specimenId: coalesce(rel.specimen.create.specimenId, randomUUID()) })
  ON CREATE SET s.createdAt = datetime()

  SET s += {
    canonicalName: CASE WHEN rel.specimen.create.canonicalName IS NULL THEN s.canonicalName ELSE rel.specimen.create.canonicalName END,
    specimenType: CASE WHEN rel.specimen.create.specimenType IS NULL THEN s.specimenType ELSE rel.specimen.create.specimenType END,
    matrix: CASE WHEN rel.specimen.create.matrix IS NULL THEN s.matrix ELSE rel.specimen.create.matrix END,
    biologicalDomain: CASE WHEN rel.specimen.create.biologicalDomain IS NULL THEN s.biologicalDomain ELSE rel.specimen.create.biologicalDomain END,
    collectionContextCategory: CASE WHEN rel.specimen.create.collectionContextCategory IS NULL THEN s.collectionContextCategory ELSE rel.specimen.create.collectionContextCategory END,
    validAt: CASE WHEN rel.specimen.create.validAt IS NULL THEN s.validAt ELSE rel.specimen.create.validAt END,
    invalidAt: CASE WHEN rel.specimen.create.invalidAt IS NULL THEN s.invalidAt ELSE rel.specimen.create.invalidAt END,
    expiredAt: CASE WHEN rel.specimen.create.expiredAt IS NULL THEN s.expiredAt ELSE rel.specimen.create.expiredAt END
  }

  MERGE (lt)-[r:REQUIRES_SPECIMEN]->(s)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    specimenRole: CASE WHEN rel.specimenRole IS NULL THEN r.specimenRole ELSE rel.specimenRole END,
    collectionSetting: CASE WHEN rel.collectionSetting IS NULL THEN r.collectionSetting ELSE rel.collectionSetting END,
    collectionMethod: CASE WHEN rel.collectionMethod IS NULL THEN r.collectionMethod ELSE rel.collectionMethod END,
    fastingRequired: CASE WHEN rel.fastingRequired IS NULL THEN r.fastingRequired ELSE rel.fastingRequired END,
    fastingMinHours: CASE WHEN rel.fastingMinHours IS NULL THEN r.fastingMinHours ELSE rel.fastingMinHours END,
    fastingMaxHours: CASE WHEN rel.fastingMaxHours IS NULL THEN r.fastingMaxHours ELSE rel.fastingMaxHours END,
    requiresAppointment: CASE WHEN rel.requiresAppointment IS NULL THEN r.requiresAppointment ELSE rel.requiresAppointment END,
    requiresColdChainDuringCollection: CASE WHEN rel.requiresColdChainDuringCollection IS NULL THEN r.requiresColdChainDuringCollection ELSE rel.requiresColdChainDuringCollection END,
    collectionTimeWindow: CASE WHEN rel.collectionTimeWindow IS NULL THEN r.collectionTimeWindow ELSE rel.collectionTimeWindow END,
    collectionNotes: CASE WHEN rel.collectionNotes IS NULL THEN r.collectionNotes ELSE rel.collectionNotes END,
    processingMustCentrifuge: CASE WHEN rel.processingMustCentrifuge IS NULL THEN r.processingMustCentrifuge ELSE rel.processingMustCentrifuge END,
    processingCentrifugeWithinMinutes: CASE WHEN rel.processingCentrifugeWithinMinutes IS NULL THEN r.processingCentrifugeWithinMinutes ELSE rel.processingCentrifugeWithinMinutes END,
    processingAliquotRequired: CASE WHEN rel.processingAliquotRequired IS NULL THEN r.processingAliquotRequired ELSE rel.processingAliquotRequired END,
    processingAdditive: CASE WHEN rel.processingAdditive IS NULL THEN r.processingAdditive ELSE rel.processingAdditive END,
    processingLightSensitive: CASE WHEN rel.processingLightSensitive IS NULL THEN r.processingLightSensitive ELSE rel.processingLightSensitive END,
    processingMixInversions: CASE WHEN rel.processingMixInversions IS NULL THEN r.processingMixInversions ELSE rel.processingMixInversions END,
    processingMaxRoomTempMinutes: CASE WHEN rel.processingMaxRoomTempMinutes IS NULL THEN r.processingMaxRoomTempMinutes ELSE rel.processingMaxRoomTempMinutes END,
    processingNotes: CASE WHEN rel.processingNotes IS NULL THEN r.processingNotes ELSE rel.processingNotes END,
    stabilityAtRoomTempMaxHours: CASE WHEN rel.stabilityAtRoomTempMaxHours IS NULL THEN r.stabilityAtRoomTempMaxHours ELSE rel.stabilityAtRoomTempMaxHours END,
    stabilityRefrigeratedMaxHours: CASE WHEN rel.stabilityRefrigeratedMaxHours IS NULL THEN r.stabilityRefrigeratedMaxHours ELSE rel.stabilityRefrigeratedMaxHours END,
    stabilityFrozenMaxDays: CASE WHEN rel.stabilityFrozenMaxDays IS NULL THEN r.stabilityFrozenMaxDays ELSE rel.stabilityFrozenMaxDays END,
    stabilityMinTempC: CASE WHEN rel.stabilityMinTempC IS NULL THEN r.stabilityMinTempC ELSE rel.stabilityMinTempC END,
    stabilityMaxTempC: CASE WHEN rel.stabilityMaxTempC IS NULL THEN r.stabilityMaxTempC ELSE rel.stabilityMaxTempC END,
    stabilityRequiresColdChain: CASE WHEN rel.stabilityRequiresColdChain IS NULL THEN r.stabilityRequiresColdChain ELSE rel.stabilityRequiresColdChain END,
    stabilityNotes: CASE WHEN rel.stabilityNotes IS NULL THEN r.stabilityNotes ELSE rel.stabilityNotes END,
    populationTags: CASE
      WHEN rel.populationTags IS NULL THEN r.populationTags
      ELSE apoc.coll.toSet(coalesce(r.populationTags, []) + coalesce(rel.populationTags, []))
    END,
    sex: CASE WHEN rel.sex IS NULL THEN r.sex ELSE rel.sex END,
    ageMinYears: CASE WHEN rel.ageMinYears IS NULL THEN r.ageMinYears ELSE rel.ageMinYears END,
    ageMaxYears: CASE WHEN rel.ageMaxYears IS NULL THEN r.ageMaxYears ELSE rel.ageMaxYears END,
    measurementState: CASE WHEN rel.measurementState IS NULL THEN r.measurementState ELSE rel.measurementState END,
    timeOfDay: CASE WHEN rel.timeOfDay IS NULL THEN r.timeOfDay ELSE rel.timeOfDay END,
    conditionTags: CASE
      WHEN rel.conditionTags IS NULL THEN r.conditionTags
      ELSE apoc.coll.toSet(coalesce(r.conditionTags, []) + coalesce(rel.conditionTags, []))
    END,
    medicationClassTags: CASE
      WHEN rel.medicationClassTags IS NULL THEN r.medicationClassTags
      ELSE apoc.coll.toSet(coalesce(r.medicationClassTags, []) + coalesce(rel.medicationClassTags, []))
    END,
    comorbidityTags: CASE
      WHEN rel.comorbidityTags IS NULL THEN r.comorbidityTags
      ELSE apoc.coll.toSet(coalesce(r.comorbidityTags, []) + coalesce(rel.comorbidityTags, []))
    END,
    appliesWhen: CASE WHEN rel.appliesWhen IS NULL THEN r.appliesWhen ELSE rel.appliesWhen END,
    thresholdDirection: CASE WHEN rel.thresholdDirection IS NULL THEN r.thresholdDirection ELSE rel.thresholdDirection END,
    thresholdValue: CASE WHEN rel.thresholdValue IS NULL THEN r.thresholdValue ELSE rel.thresholdValue END,
    thresholdUnit: CASE WHEN rel.thresholdUnit IS NULL THEN r.thresholdUnit ELSE rel.thresholdUnit END,
    evidenceContextTags: CASE
      WHEN rel.evidenceContextTags IS NULL THEN r.evidenceContextTags
      ELSE apoc.coll.toSet(coalesce(r.evidenceContextTags, []) + coalesce(rel.evidenceContextTags, []))
    END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okRS

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.specimen.connect IS NOT NULL

  OPTIONAL MATCH (s2:Specimen {specimenId: rel.specimen.connect.specimenId})
  CALL apoc.util.validate(
    s2 IS NULL,
    'REQUIRES_SPECIMEN connect failed: Specimen not found for specimenId %s',
    [rel.specimen.connect.specimenId]
  )

  MERGE (lt)-[r2:REQUIRES_SPECIMEN]->(s2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    specimenRole: CASE WHEN rel.specimenRole IS NULL THEN r2.specimenRole ELSE rel.specimenRole END,
    collectionSetting: CASE WHEN rel.collectionSetting IS NULL THEN r2.collectionSetting ELSE rel.collectionSetting END,
    collectionMethod: CASE WHEN rel.collectionMethod IS NULL THEN r2.collectionMethod ELSE rel.collectionMethod END,
    fastingRequired: CASE WHEN rel.fastingRequired IS NULL THEN r2.fastingRequired ELSE rel.fastingRequired END,
    fastingMinHours: CASE WHEN rel.fastingMinHours IS NULL THEN r2.fastingMinHours ELSE rel.fastingMinHours END,
    fastingMaxHours: CASE WHEN rel.fastingMaxHours IS NULL THEN r2.fastingMaxHours ELSE rel.fastingMaxHours END,
    requiresAppointment: CASE WHEN rel.requiresAppointment IS NULL THEN r2.requiresAppointment ELSE rel.requiresAppointment END,
    requiresColdChainDuringCollection: CASE WHEN rel.requiresColdChainDuringCollection IS NULL THEN r2.requiresColdChainDuringCollection ELSE rel.requiresColdChainDuringCollection END,
    collectionTimeWindow: CASE WHEN rel.collectionTimeWindow IS NULL THEN r2.collectionTimeWindow ELSE rel.collectionTimeWindow END,
    collectionNotes: CASE WHEN rel.collectionNotes IS NULL THEN r2.collectionNotes ELSE rel.collectionNotes END,
    processingMustCentrifuge: CASE WHEN rel.processingMustCentrifuge IS NULL THEN r2.processingMustCentrifuge ELSE rel.processingMustCentrifuge END,
    processingCentrifugeWithinMinutes: CASE WHEN rel.processingCentrifugeWithinMinutes IS NULL THEN r2.processingCentrifugeWithinMinutes ELSE rel.processingCentrifugeWithinMinutes END,
    processingAliquotRequired: CASE WHEN rel.processingAliquotRequired IS NULL THEN r2.processingAliquotRequired ELSE rel.processingAliquotRequired END,
    processingAdditive: CASE WHEN rel.processingAdditive IS NULL THEN r2.processingAdditive ELSE rel.processingAdditive END,
    processingLightSensitive: CASE WHEN rel.processingLightSensitive IS NULL THEN r2.processingLightSensitive ELSE rel.processingLightSensitive END,
    processingMixInversions: CASE WHEN rel.processingMixInversions IS NULL THEN r2.processingMixInversions ELSE rel.processingMixInversions END,
    processingMaxRoomTempMinutes: CASE WHEN rel.processingMaxRoomTempMinutes IS NULL THEN r2.processingMaxRoomTempMinutes ELSE rel.processingMaxRoomTempMinutes END,
    processingNotes: CASE WHEN rel.processingNotes IS NULL THEN r2.processingNotes ELSE rel.processingNotes END,
    stabilityAtRoomTempMaxHours: CASE WHEN rel.stabilityAtRoomTempMaxHours IS NULL THEN r2.stabilityAtRoomTempMaxHours ELSE rel.stabilityAtRoomTempMaxHours END,
    stabilityRefrigeratedMaxHours: CASE WHEN rel.stabilityRefrigeratedMaxHours IS NULL THEN r2.stabilityRefrigeratedMaxHours ELSE rel.stabilityRefrigeratedMaxHours END,
    stabilityFrozenMaxDays: CASE WHEN rel.stabilityFrozenMaxDays IS NULL THEN r2.stabilityFrozenMaxDays ELSE rel.stabilityFrozenMaxDays END,
    stabilityMinTempC: CASE WHEN rel.stabilityMinTempC IS NULL THEN r2.stabilityMinTempC ELSE rel.stabilityMinTempC END,
    stabilityMaxTempC: CASE WHEN rel.stabilityMaxTempC IS NULL THEN r2.stabilityMaxTempC ELSE rel.stabilityMaxTempC END,
    stabilityRequiresColdChain: CASE WHEN rel.stabilityRequiresColdChain IS NULL THEN r2.stabilityRequiresColdChain ELSE rel.stabilityRequiresColdChain END,
    stabilityNotes: CASE WHEN rel.stabilityNotes IS NULL THEN r2.stabilityNotes ELSE rel.stabilityNotes END,
    populationTags: CASE
      WHEN rel.populationTags IS NULL THEN r2.populationTags
      ELSE apoc.coll.toSet(coalesce(r2.populationTags, []) + coalesce(rel.populationTags, []))
    END,
    sex: CASE WHEN rel.sex IS NULL THEN r2.sex ELSE rel.sex END,
    ageMinYears: CASE WHEN rel.ageMinYears IS NULL THEN r2.ageMinYears ELSE rel.ageMinYears END,
    ageMaxYears: CASE WHEN rel.ageMaxYears IS NULL THEN r2.ageMaxYears ELSE rel.ageMaxYears END,
    measurementState: CASE WHEN rel.measurementState IS NULL THEN r2.measurementState ELSE rel.measurementState END,
    timeOfDay: CASE WHEN rel.timeOfDay IS NULL THEN r2.timeOfDay ELSE rel.timeOfDay END,
    conditionTags: CASE
      WHEN rel.conditionTags IS NULL THEN r2.conditionTags
      ELSE apoc.coll.toSet(coalesce(r2.conditionTags, []) + coalesce(rel.conditionTags, []))
    END,
    medicationClassTags: CASE
      WHEN rel.medicationClassTags IS NULL THEN r2.medicationClassTags
      ELSE apoc.coll.toSet(coalesce(r2.medicationClassTags, []) + coalesce(rel.medicationClassTags, []))
    END,
    comorbidityTags: CASE
      WHEN rel.comorbidityTags IS NULL THEN r2.comorbidityTags
      ELSE apoc.coll.toSet(coalesce(r2.comorbidityTags, []) + coalesce(rel.comorbidityTags, []))
    END,
    appliesWhen: CASE WHEN rel.appliesWhen IS NULL THEN r2.appliesWhen ELSE rel.appliesWhen END,
    thresholdDirection: CASE WHEN rel.thresholdDirection IS NULL THEN r2.thresholdDirection ELSE rel.thresholdDirection END,
    thresholdValue: CASE WHEN rel.thresholdValue IS NULL THEN r2.thresholdValue ELSE rel.thresholdValue END,
    thresholdUnit: CASE WHEN rel.thresholdUnit IS NULL THEN r2.thresholdUnit ELSE rel.thresholdUnit END,
    evidenceContextTags: CASE
      WHEN rel.evidenceContextTags IS NULL THEN r2.evidenceContextTags
      ELSE apoc.coll.toSet(coalesce(r2.evidenceContextTags, []) + coalesce(rel.evidenceContextTags, []))
    END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okRS

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.specimen.update IS NOT NULL

  CALL apoc.util.validate(
    rel.specimen.update.specimenId IS NULL,
    'REQUIRES_SPECIMEN update failed: specimen.update.specimenId is required',
    []
  )

  OPTIONAL MATCH (s3:Specimen {specimenId: rel.specimen.update.specimenId})
  OPTIONAL MATCH (lt)-[r3:REQUIRES_SPECIMEN]->(s3)

  CALL apoc.util.validate(
    s3 IS NULL,
    'REQUIRES_SPECIMEN update failed: Specimen not found for specimenId %s',
    [rel.specimen.update.specimenId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'REQUIRES_SPECIMEN update failed: REQUIRES_SPECIMEN relationship not found for labTest %s -> specimen %s',
    [$labTestId, rel.specimen.update.specimenId]
  )

  SET s3 += {
    canonicalName: CASE WHEN rel.specimen.update.canonicalName IS NULL THEN s3.canonicalName ELSE rel.specimen.update.canonicalName END,
    specimenType: CASE WHEN rel.specimen.update.specimenType IS NULL THEN s3.specimenType ELSE rel.specimen.update.specimenType END,
    matrix: CASE WHEN rel.specimen.update.matrix IS NULL THEN s3.matrix ELSE rel.specimen.update.matrix END,
    biologicalDomain: CASE WHEN rel.specimen.update.biologicalDomain IS NULL THEN s3.biologicalDomain ELSE rel.specimen.update.biologicalDomain END,
    collectionContextCategory: CASE WHEN rel.specimen.update.collectionContextCategory IS NULL THEN s3.collectionContextCategory ELSE rel.specimen.update.collectionContextCategory END,
    validAt: CASE WHEN rel.specimen.update.validAt IS NULL THEN s3.validAt ELSE rel.specimen.update.validAt END,
    invalidAt: CASE WHEN rel.specimen.update.invalidAt IS NULL THEN s3.invalidAt ELSE rel.specimen.update.invalidAt END,
    expiredAt: CASE WHEN rel.specimen.update.expiredAt IS NULL THEN s3.expiredAt ELSE rel.specimen.update.expiredAt END
  }

  SET r3 += {
    specimenRole: CASE WHEN rel.specimenRole IS NULL THEN r3.specimenRole ELSE rel.specimenRole END,
    collectionSetting: CASE WHEN rel.collectionSetting IS NULL THEN r3.collectionSetting ELSE rel.collectionSetting END,
    collectionMethod: CASE WHEN rel.collectionMethod IS NULL THEN r3.collectionMethod ELSE rel.collectionMethod END,
    fastingRequired: CASE WHEN rel.fastingRequired IS NULL THEN r3.fastingRequired ELSE rel.fastingRequired END,
    fastingMinHours: CASE WHEN rel.fastingMinHours IS NULL THEN r3.fastingMinHours ELSE rel.fastingMinHours END,
    fastingMaxHours: CASE WHEN rel.fastingMaxHours IS NULL THEN r3.fastingMaxHours ELSE rel.fastingMaxHours END,
    requiresAppointment: CASE WHEN rel.requiresAppointment IS NULL THEN r3.requiresAppointment ELSE rel.requiresAppointment END,
    requiresColdChainDuringCollection: CASE WHEN rel.requiresColdChainDuringCollection IS NULL THEN r3.requiresColdChainDuringCollection ELSE rel.requiresColdChainDuringCollection END,
    collectionTimeWindow: CASE WHEN rel.collectionTimeWindow IS NULL THEN r3.collectionTimeWindow ELSE rel.collectionTimeWindow END,
    collectionNotes: CASE WHEN rel.collectionNotes IS NULL THEN r3.collectionNotes ELSE rel.collectionNotes END,
    processingMustCentrifuge: CASE WHEN rel.processingMustCentrifuge IS NULL THEN r3.processingMustCentrifuge ELSE rel.processingMustCentrifuge END,
    processingCentrifugeWithinMinutes: CASE WHEN rel.processingCentrifugeWithinMinutes IS NULL THEN r3.processingCentrifugeWithinMinutes ELSE rel.processingCentrifugeWithinMinutes END,
    processingAliquotRequired: CASE WHEN rel.processingAliquotRequired IS NULL THEN r3.processingAliquotRequired ELSE rel.processingAliquotRequired END,
    processingAdditive: CASE WHEN rel.processingAdditive IS NULL THEN r3.processingAdditive ELSE rel.processingAdditive END,
    processingLightSensitive: CASE WHEN rel.processingLightSensitive IS NULL THEN r3.processingLightSensitive ELSE rel.processingLightSensitive END,
    processingMixInversions: CASE WHEN rel.processingMixInversions IS NULL THEN r3.processingMixInversions ELSE rel.processingMixInversions END,
    processingMaxRoomTempMinutes: CASE WHEN rel.processingMaxRoomTempMinutes IS NULL THEN r3.processingMaxRoomTempMinutes ELSE rel.processingMaxRoomTempMinutes END,
    processingNotes: CASE WHEN rel.processingNotes IS NULL THEN r3.processingNotes ELSE rel.processingNotes END,
    stabilityAtRoomTempMaxHours: CASE WHEN rel.stabilityAtRoomTempMaxHours IS NULL THEN r3.stabilityAtRoomTempMaxHours ELSE rel.stabilityAtRoomTempMaxHours END,
    stabilityRefrigeratedMaxHours: CASE WHEN rel.stabilityRefrigeratedMaxHours IS NULL THEN r3.stabilityRefrigeratedMaxHours ELSE rel.stabilityRefrigeratedMaxHours END,
    stabilityFrozenMaxDays: CASE WHEN rel.stabilityFrozenMaxDays IS NULL THEN r3.stabilityFrozenMaxDays ELSE rel.stabilityFrozenMaxDays END,
    stabilityMinTempC: CASE WHEN rel.stabilityMinTempC IS NULL THEN r3.stabilityMinTempC ELSE rel.stabilityMinTempC END,
    stabilityMaxTempC: CASE WHEN rel.stabilityMaxTempC IS NULL THEN r3.stabilityMaxTempC ELSE rel.stabilityMaxTempC END,
    stabilityRequiresColdChain: CASE WHEN rel.stabilityRequiresColdChain IS NULL THEN r3.stabilityRequiresColdChain ELSE rel.stabilityRequiresColdChain END,
    stabilityNotes: CASE WHEN rel.stabilityNotes IS NULL THEN r3.stabilityNotes ELSE rel.stabilityNotes END,
    populationTags: CASE
      WHEN rel.populationTags IS NULL THEN r3.populationTags
      ELSE apoc.coll.toSet(coalesce(r3.populationTags, []) + coalesce(rel.populationTags, []))
    END,
    sex: CASE WHEN rel.sex IS NULL THEN r3.sex ELSE rel.sex END,
    ageMinYears: CASE WHEN rel.ageMinYears IS NULL THEN r3.ageMinYears ELSE rel.ageMinYears END,
    ageMaxYears: CASE WHEN rel.ageMaxYears IS NULL THEN r3.ageMaxYears ELSE rel.ageMaxYears END,
    measurementState: CASE WHEN rel.measurementState IS NULL THEN r3.measurementState ELSE rel.measurementState END,
    timeOfDay: CASE WHEN rel.timeOfDay IS NULL THEN r3.timeOfDay ELSE rel.timeOfDay END,
    conditionTags: CASE
      WHEN rel.conditionTags IS NULL THEN r3.conditionTags
      ELSE apoc.coll.toSet(coalesce(r3.conditionTags, []) + coalesce(rel.conditionTags, []))
    END,
    medicationClassTags: CASE
      WHEN rel.medicationClassTags IS NULL THEN r3.medicationClassTags
      ELSE apoc.coll.toSet(coalesce(r3.medicationClassTags, []) + coalesce(rel.medicationClassTags, []))
    END,
    comorbidityTags: CASE
      WHEN rel.comorbidityTags IS NULL THEN r3.comorbidityTags
      ELSE apoc.coll.toSet(coalesce(r3.comorbidityTags, []) + coalesce(rel.comorbidityTags, []))
    END,
    appliesWhen: CASE WHEN rel.appliesWhen IS NULL THEN r3.appliesWhen ELSE rel.appliesWhen END,
    thresholdDirection: CASE WHEN rel.thresholdDirection IS NULL THEN r3.thresholdDirection ELSE rel.thresholdDirection END,
    thresholdValue: CASE WHEN rel.thresholdValue IS NULL THEN r3.thresholdValue ELSE rel.thresholdValue END,
    thresholdUnit: CASE WHEN rel.thresholdUnit IS NULL THEN r3.thresholdUnit ELSE rel.thresholdUnit END,
    evidenceContextTags: CASE
      WHEN rel.evidenceContextTags IS NULL THEN r3.evidenceContextTags
      ELSE apoc.coll.toSet(coalesce(r3.evidenceContextTags, []) + coalesce(rel.evidenceContextTags, []))
    END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okRS
}
RETURN count(*) AS _requiresSpecimenProcessed
`;

// ==================================================================
// USES_PLATFORM (create / connect / update)
// ==================================================================
export const updateLabTestUsesPlatformCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})
UNWIND $usesPlatform AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.technologyPlatform.create IS NOT NULL

  MERGE (tp:TechnologyPlatform { platformId: coalesce(rel.technologyPlatform.create.platformId, randomUUID()) })
  ON CREATE SET tp.createdAt = datetime()

  SET tp += {
    canonicalName: CASE WHEN rel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE rel.technologyPlatform.create.canonicalName END,
    aliases: CASE
      WHEN rel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
      ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(rel.technologyPlatform.create.aliases, []))
    END,
    platformType: CASE WHEN rel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE rel.technologyPlatform.create.platformType END,
    description: CASE WHEN rel.technologyPlatform.create.description IS NULL THEN tp.description ELSE rel.technologyPlatform.create.description END,
    validAt: CASE WHEN rel.technologyPlatform.create.validAt IS NULL THEN tp.validAt ELSE rel.technologyPlatform.create.validAt END,
    invalidAt: CASE WHEN rel.technologyPlatform.create.invalidAt IS NULL THEN tp.invalidAt ELSE rel.technologyPlatform.create.invalidAt END,
    expiredAt: CASE WHEN rel.technologyPlatform.create.expiredAt IS NULL THEN tp.expiredAt ELSE rel.technologyPlatform.create.expiredAt END
  }

  MERGE (lt)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okUP

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp2:TechnologyPlatform {platformId: rel.technologyPlatform.connect.platformId})
  CALL apoc.util.validate(
    tp2 IS NULL,
    'USES_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [rel.technologyPlatform.connect.platformId]
  )

  MERGE (lt)-[r2:USES_PLATFORM]->(tp2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okUP

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH lt, rel
  WITH lt, rel WHERE rel.technologyPlatform.update IS NOT NULL

  CALL apoc.util.validate(
    rel.technologyPlatform.update.platformId IS NULL,
    'USES_PLATFORM update failed: technologyPlatform.update.platformId is required',
    []
  )

  OPTIONAL MATCH (tp3:TechnologyPlatform {platformId: rel.technologyPlatform.update.platformId})
  OPTIONAL MATCH (lt)-[r3:USES_PLATFORM]->(tp3)

  CALL apoc.util.validate(
    tp3 IS NULL,
    'USES_PLATFORM update failed: TechnologyPlatform not found for platformId %s',
    [rel.technologyPlatform.update.platformId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'USES_PLATFORM update failed: USES_PLATFORM relationship not found for labTest %s -> technologyPlatform %s',
    [$labTestId, rel.technologyPlatform.update.platformId]
  )

  SET tp3 += {
    canonicalName: CASE WHEN rel.technologyPlatform.update.canonicalName IS NULL THEN tp3.canonicalName ELSE rel.technologyPlatform.update.canonicalName END,
    aliases: CASE
      WHEN rel.technologyPlatform.update.aliases IS NULL THEN tp3.aliases
      ELSE apoc.coll.toSet(coalesce(tp3.aliases, []) + coalesce(rel.technologyPlatform.update.aliases, []))
    END,
    platformType: CASE WHEN rel.technologyPlatform.update.platformType IS NULL THEN tp3.platformType ELSE rel.technologyPlatform.update.platformType END,
    description: CASE WHEN rel.technologyPlatform.update.description IS NULL THEN tp3.description ELSE rel.technologyPlatform.update.description END,
    validAt: CASE WHEN rel.technologyPlatform.update.validAt IS NULL THEN tp3.validAt ELSE rel.technologyPlatform.update.validAt END,
    invalidAt: CASE WHEN rel.technologyPlatform.update.invalidAt IS NULL THEN tp3.invalidAt ELSE rel.technologyPlatform.update.invalidAt END,
    expiredAt: CASE WHEN rel.technologyPlatform.update.expiredAt IS NULL THEN tp3.expiredAt ELSE rel.technologyPlatform.update.expiredAt END
  }

  SET r3 += {
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okUP
}
RETURN count(*) AS _usesPlatformProcessed
`;

export const returnUpdatedLabTestCypher = `
MATCH (lt:LabTest {labTestId: $labTestId})
RETURN lt
`;

export const updateLabTestStatements = {
  updateLabTestMeasuresBiomarkerCypher,
  updateLabTestUsesMethodCypher,
  updateLabTestRequiresSpecimenCypher,
  updateLabTestUsesPlatformCypher,
  returnUpdatedLabTestCypher,
};
