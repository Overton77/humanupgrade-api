import {
  DeviceIdentifierKey,
  DeviceTypeIdentifierKey,
  FunctionalMetricIdentifierKey,
  ModalityIdentifierKey,
  ModalityParameterIdentifierKey,
  ModalityTypeIdentifierKey,
  SensorIdentifierKey,
} from "../types.js";

// ============================================================================
// FUNCTIONAL METRIC
// ============================================================================

export function buildFunctionalMetricUpsertCypher(
  key: FunctionalMetricIdentifierKey
): string {
  return `
    MERGE (fm:FunctionalMetric { ${key}: $idValue })
    ON CREATE SET fm.createdAt = datetime()

    SET fm.functionalMetricId = coalesce(fm.functionalMetricId, randomUUID())

    SET fm += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN fm.canonicalName ELSE $canonicalName END,
      aliases: CASE
        WHEN $aliases IS NULL THEN fm.aliases
        ELSE apoc.coll.toSet(coalesce(fm.aliases, []) + coalesce($aliases, []))
      END,
      description: CASE WHEN $description IS NULL THEN fm.description ELSE $description END,
      metricType: CASE WHEN $metricType IS NULL THEN fm.metricType ELSE $metricType END,
      unit: CASE WHEN $unit IS NULL THEN fm.unit ELSE $unit END,
      valueType: CASE WHEN $valueType IS NULL THEN fm.valueType ELSE $valueType END,
      validAt: CASE WHEN $validAt IS NULL THEN fm.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN fm.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN fm.expiredAt ELSE $expiredAt END
    }

    RETURN fm
  `;
}

export const returnFunctionalMetricCypher = `
MATCH (fm:FunctionalMetric {functionalMetricId: $functionalMetricId})
RETURN fm
`;

export const functionalMetricStatements = {
  returnFunctionalMetricCypher,
};

// ============================================================================
// DEVICE TYPE
// ============================================================================

export function buildDeviceTypeUpsertCypher(
  key: DeviceTypeIdentifierKey
): string {
  return `
    MERGE (dt:DeviceType { ${key}: $idValue })
    ON CREATE SET dt.createdAt = datetime()

    SET dt.deviceTypeId = coalesce(dt.deviceTypeId, randomUUID())

    SET dt += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN dt.canonicalName ELSE $canonicalName END,
      description: CASE WHEN $description IS NULL THEN dt.description ELSE $description END,
      deviceTypeFamily: CASE WHEN $deviceTypeFamily IS NULL THEN dt.deviceTypeFamily ELSE $deviceTypeFamily END,
      validAt: CASE WHEN $validAt IS NULL THEN dt.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN dt.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN dt.expiredAt ELSE $expiredAt END
    }

    RETURN dt
  `;
}

export const returnDeviceTypeCypher = `
MATCH (dt:DeviceType {deviceTypeId: $deviceTypeId})
RETURN dt
`;

export const deviceTypeStatements = {
  returnDeviceTypeCypher,
};

// ============================================================================
// MODALITY TYPE
// ============================================================================

export function buildModalityTypeUpsertCypher(
  key: ModalityTypeIdentifierKey
): string {
  return `
    MERGE (mt:ModalityType { ${key}: $idValue })
    ON CREATE SET mt.createdAt = datetime()

    SET mt.modalityTypeId = coalesce(mt.modalityTypeId, randomUUID())

    SET mt += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN mt.canonicalName ELSE $canonicalName END,
      description: CASE WHEN $description IS NULL THEN mt.description ELSE $description END,
      validAt: CASE WHEN $validAt IS NULL THEN mt.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN mt.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN mt.expiredAt ELSE $expiredAt END
    }

    RETURN mt
  `;
}

export const returnModalityTypeCypher = `
MATCH (mt:ModalityType {modalityTypeId: $modalityTypeId})
RETURN mt
`;

export const modalityTypeStatements = {
  returnModalityTypeCypher,
};

// ============================================================================
// MODALITY PARAMETER (standalone — also used inline in modalityHasParameterCypher)
// ============================================================================

export function buildModalityParameterUpsertCypher(
  key: ModalityParameterIdentifierKey
): string {
  return `
    MERGE (mp:ModalityParameter { ${key}: $idValue })
    ON CREATE SET mp.createdAt = datetime()

    SET mp.modalityParameterId = coalesce(mp.modalityParameterId, randomUUID())

    SET mp += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN mp.canonicalName ELSE $canonicalName END,
      description: CASE WHEN $description IS NULL THEN mp.description ELSE $description END,
      parameterKey: CASE WHEN $parameterKey IS NULL THEN mp.parameterKey ELSE $parameterKey END,
      valueType: CASE WHEN $valueType IS NULL THEN mp.valueType ELSE $valueType END,
      defaultValue: CASE WHEN $defaultValue IS NULL THEN mp.defaultValue ELSE $defaultValue END,
      unit: CASE WHEN $unit IS NULL THEN mp.unit ELSE $unit END,
      validAt: CASE WHEN $validAt IS NULL THEN mp.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN mp.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN mp.expiredAt ELSE $expiredAt END
    }

    RETURN mp
  `;
}

export const returnModalityParameterCypher = `
MATCH (mp:ModalityParameter {modalityParameterId: $modalityParameterId})
RETURN mp
`;

export const modalityParameterStatements = {
  returnModalityParameterCypher,
};

// ============================================================================
// SENSOR
// ============================================================================

export function buildSensorUpsertCypher(key: SensorIdentifierKey): string {
  return `
    MERGE (sn:Sensor { ${key}: $idValue })
    ON CREATE SET sn.createdAt = datetime()

    SET sn.sensorId = coalesce(sn.sensorId, randomUUID())

    SET sn += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN sn.canonicalName ELSE $canonicalName END,
      aliases: CASE
        WHEN $aliases IS NULL THEN sn.aliases
        ELSE apoc.coll.toSet(coalesce(sn.aliases, []) + coalesce($aliases, []))
      END,
      description: CASE WHEN $description IS NULL THEN sn.description ELSE $description END,
      sensorType: CASE WHEN $sensorType IS NULL THEN sn.sensorType ELSE $sensorType END,
      validAt: CASE WHEN $validAt IS NULL THEN sn.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN sn.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN sn.expiredAt ELSE $expiredAt END
    }

    RETURN sn
  `;
}

// (Sensor)-[:MEASURES_METRIC]->(FunctionalMetric)
// Params: $sensorId, $measuresMetric
export const sensorMeasuresMetricCypher = `
MATCH (sn:Sensor {sensorId: $sensorId})

UNWIND coalesce($measuresMetric, []) AS fmRel
CALL {
  // ---- upsert branch ----
  WITH sn, fmRel
  WITH sn, fmRel
  WHERE fmRel.functionalMetric.upsert IS NOT NULL

  MERGE (fm:FunctionalMetric {functionalMetricId: coalesce(fmRel.functionalMetric.upsert.functionalMetricId, randomUUID())})
  ON CREATE SET fm.createdAt = datetime()

  SET fm += {
    canonicalName: CASE WHEN fmRel.functionalMetric.upsert.canonicalName IS NULL THEN fm.canonicalName ELSE fmRel.functionalMetric.upsert.canonicalName END,
    aliases: CASE
      WHEN fmRel.functionalMetric.upsert.aliases IS NULL THEN fm.aliases
      ELSE apoc.coll.toSet(coalesce(fm.aliases, []) + coalesce(fmRel.functionalMetric.upsert.aliases, []))
    END,
    description: CASE WHEN fmRel.functionalMetric.upsert.description IS NULL THEN fm.description ELSE fmRel.functionalMetric.upsert.description END,
    metricType: CASE WHEN fmRel.functionalMetric.upsert.metricType IS NULL THEN fm.metricType ELSE fmRel.functionalMetric.upsert.metricType END,
    unit: CASE WHEN fmRel.functionalMetric.upsert.unit IS NULL THEN fm.unit ELSE fmRel.functionalMetric.upsert.unit END,
    valueType: CASE WHEN fmRel.functionalMetric.upsert.valueType IS NULL THEN fm.valueType ELSE fmRel.functionalMetric.upsert.valueType END,
    validAt: CASE WHEN fmRel.functionalMetric.upsert.validAt IS NULL THEN fm.validAt ELSE fmRel.functionalMetric.upsert.validAt END,
    invalidAt: CASE WHEN fmRel.functionalMetric.upsert.invalidAt IS NULL THEN fm.invalidAt ELSE fmRel.functionalMetric.upsert.invalidAt END,
    expiredAt: CASE WHEN fmRel.functionalMetric.upsert.expiredAt IS NULL THEN fm.expiredAt ELSE fmRel.functionalMetric.upsert.expiredAt END
  }

  MERGE (sn)-[r:MEASURES_METRIC]->(fm)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    signalType: CASE WHEN fmRel.signalType IS NULL THEN r.signalType ELSE fmRel.signalType END,
    unit: CASE WHEN fmRel.unit IS NULL THEN r.unit ELSE fmRel.unit END,
    samplingRateHz: CASE WHEN fmRel.samplingRateHz IS NULL THEN r.samplingRateHz ELSE fmRel.samplingRateHz END,
    notes: CASE WHEN fmRel.notes IS NULL THEN r.notes ELSE fmRel.notes END,
    validAt: CASE WHEN fmRel.validAt IS NULL THEN r.validAt ELSE fmRel.validAt END,
    invalidAt: CASE WHEN fmRel.invalidAt IS NULL THEN r.invalidAt ELSE fmRel.invalidAt END,
    expiredAt: CASE WHEN fmRel.expiredAt IS NULL THEN r.expiredAt ELSE fmRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH sn, fmRel
  WITH sn, fmRel
  WHERE fmRel.functionalMetric.connect IS NOT NULL

  OPTIONAL MATCH (fm:FunctionalMetric {functionalMetricId: fmRel.functionalMetric.connect.functionalMetricId})
  WITH sn, fmRel, fm

  CALL apoc.util.validate(
    fm IS NULL,
    'MEASURES_METRIC connect failed: FunctionalMetric not found for functionalMetricId %s',
    [fmRel.functionalMetric.connect.functionalMetricId]
  )

  MERGE (sn)-[r:MEASURES_METRIC]->(fm)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    signalType: CASE WHEN fmRel.signalType IS NULL THEN r.signalType ELSE fmRel.signalType END,
    unit: CASE WHEN fmRel.unit IS NULL THEN r.unit ELSE fmRel.unit END,
    samplingRateHz: CASE WHEN fmRel.samplingRateHz IS NULL THEN r.samplingRateHz ELSE fmRel.samplingRateHz END,
    notes: CASE WHEN fmRel.notes IS NULL THEN r.notes ELSE fmRel.notes END,
    validAt: CASE WHEN fmRel.validAt IS NULL THEN r.validAt ELSE fmRel.validAt END,
    invalidAt: CASE WHEN fmRel.invalidAt IS NULL THEN r.invalidAt ELSE fmRel.invalidAt END,
    expiredAt: CASE WHEN fmRel.expiredAt IS NULL THEN r.expiredAt ELSE fmRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH sn, fmRel
  WITH sn, fmRel
  WHERE fmRel.functionalMetric.connectByKey IS NOT NULL

  OPTIONAL MATCH (fm:FunctionalMetric {canonicalName: fmRel.functionalMetric.connectByKey.canonicalName})
  WITH sn, fmRel, fm

  CALL apoc.util.validate(
    fm IS NULL,
    'MEASURES_METRIC connectByKey failed: FunctionalMetric not found for canonicalName %s',
    [fmRel.functionalMetric.connectByKey.canonicalName]
  )

  MERGE (sn)-[r:MEASURES_METRIC]->(fm)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    signalType: CASE WHEN fmRel.signalType IS NULL THEN r.signalType ELSE fmRel.signalType END,
    unit: CASE WHEN fmRel.unit IS NULL THEN r.unit ELSE fmRel.unit END,
    samplingRateHz: CASE WHEN fmRel.samplingRateHz IS NULL THEN r.samplingRateHz ELSE fmRel.samplingRateHz END,
    notes: CASE WHEN fmRel.notes IS NULL THEN r.notes ELSE fmRel.notes END,
    validAt: CASE WHEN fmRel.validAt IS NULL THEN r.validAt ELSE fmRel.validAt END,
    invalidAt: CASE WHEN fmRel.invalidAt IS NULL THEN r.invalidAt ELSE fmRel.invalidAt END,
    expiredAt: CASE WHEN fmRel.expiredAt IS NULL THEN r.expiredAt ELSE fmRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnSensorCypher = `
MATCH (sn:Sensor {sensorId: $sensorId})
RETURN sn
`;

export const sensorStatements = {
  sensorMeasuresMetricCypher,
  returnSensorCypher,
};

// ============================================================================
// MODALITY
// ============================================================================

export function buildModalityUpsertCypher(key: ModalityIdentifierKey): string {
  return `
    MERGE (mo:Modality { ${key}: $idValue })
    ON CREATE SET mo.createdAt = datetime()

    SET mo.modalityId = coalesce(mo.modalityId, randomUUID())

    SET mo += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN mo.canonicalName ELSE $canonicalName END,
      description: CASE WHEN $description IS NULL THEN mo.description ELSE $description END,
      modalityRole: CASE WHEN $modalityRole IS NULL THEN mo.modalityRole ELSE $modalityRole END,
      validAt: CASE WHEN $validAt IS NULL THEN mo.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN mo.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN mo.expiredAt ELSE $expiredAt END
    }

    RETURN mo
  `;
}

// (Modality)-[:INSTANCE_OF]->(ModalityType)
// Params: $modalityId, $instanceOf
export const modalityInstanceOfCypher = `
MATCH (mo:Modality {modalityId: $modalityId})

UNWIND coalesce($instanceOf, []) AS mtRel
CALL {
  // ---- upsert branch ----
  WITH mo, mtRel
  WITH mo, mtRel
  WHERE mtRel.modalityType.upsert IS NOT NULL

  MERGE (mt:ModalityType {modalityTypeId: coalesce(mtRel.modalityType.upsert.modalityTypeId, randomUUID())})
  ON CREATE SET mt.createdAt = datetime()

  SET mt += {
    canonicalName: CASE WHEN mtRel.modalityType.upsert.canonicalName IS NULL THEN mt.canonicalName ELSE mtRel.modalityType.upsert.canonicalName END,
    description: CASE WHEN mtRel.modalityType.upsert.description IS NULL THEN mt.description ELSE mtRel.modalityType.upsert.description END,
    validAt: CASE WHEN mtRel.modalityType.upsert.validAt IS NULL THEN mt.validAt ELSE mtRel.modalityType.upsert.validAt END,
    invalidAt: CASE WHEN mtRel.modalityType.upsert.invalidAt IS NULL THEN mt.invalidAt ELSE mtRel.modalityType.upsert.invalidAt END,
    expiredAt: CASE WHEN mtRel.modalityType.upsert.expiredAt IS NULL THEN mt.expiredAt ELSE mtRel.modalityType.upsert.expiredAt END
  }

  MERGE (mo)-[r:INSTANCE_OF]->(mt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    validAt: CASE WHEN mtRel.validAt IS NULL THEN r.validAt ELSE mtRel.validAt END,
    invalidAt: CASE WHEN mtRel.invalidAt IS NULL THEN r.invalidAt ELSE mtRel.invalidAt END,
    expiredAt: CASE WHEN mtRel.expiredAt IS NULL THEN r.expiredAt ELSE mtRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH mo, mtRel
  WITH mo, mtRel
  WHERE mtRel.modalityType.connect IS NOT NULL

  OPTIONAL MATCH (mt:ModalityType {modalityTypeId: mtRel.modalityType.connect.modalityTypeId})
  WITH mo, mtRel, mt

  CALL apoc.util.validate(
    mt IS NULL,
    'INSTANCE_OF connect failed: ModalityType not found for modalityTypeId %s',
    [mtRel.modalityType.connect.modalityTypeId]
  )

  MERGE (mo)-[r:INSTANCE_OF]->(mt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    validAt: CASE WHEN mtRel.validAt IS NULL THEN r.validAt ELSE mtRel.validAt END,
    invalidAt: CASE WHEN mtRel.invalidAt IS NULL THEN r.invalidAt ELSE mtRel.invalidAt END,
    expiredAt: CASE WHEN mtRel.expiredAt IS NULL THEN r.expiredAt ELSE mtRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH mo, mtRel
  WITH mo, mtRel
  WHERE mtRel.modalityType.connectByKey IS NOT NULL

  OPTIONAL MATCH (mt:ModalityType {canonicalName: mtRel.modalityType.connectByKey.canonicalName})
  WITH mo, mtRel, mt

  CALL apoc.util.validate(
    mt IS NULL,
    'INSTANCE_OF connectByKey failed: ModalityType not found for canonicalName %s',
    [mtRel.modalityType.connectByKey.canonicalName]
  )

  MERGE (mo)-[r:INSTANCE_OF]->(mt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    validAt: CASE WHEN mtRel.validAt IS NULL THEN r.validAt ELSE mtRel.validAt END,
    invalidAt: CASE WHEN mtRel.invalidAt IS NULL THEN r.invalidAt ELSE mtRel.invalidAt END,
    expiredAt: CASE WHEN mtRel.expiredAt IS NULL THEN r.expiredAt ELSE mtRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Modality)-[:HAS_PARAMETER]->(ModalityParameter)
// Params: $modalityId, $hasParameter
export const modalityHasParameterCypher = `
MATCH (mo:Modality {modalityId: $modalityId})

UNWIND coalesce($hasParameter, []) AS mpRel
CALL {
  // ---- upsert branch ----
  WITH mo, mpRel
  WITH mo, mpRel
  WHERE mpRel.modalityParameter.upsert IS NOT NULL

  MERGE (mp:ModalityParameter {modalityParameterId: coalesce(mpRel.modalityParameter.upsert.modalityParameterId, randomUUID())})
  ON CREATE SET mp.createdAt = datetime()

  SET mp += {
    canonicalName: CASE WHEN mpRel.modalityParameter.upsert.canonicalName IS NULL THEN mp.canonicalName ELSE mpRel.modalityParameter.upsert.canonicalName END,
    description: CASE WHEN mpRel.modalityParameter.upsert.description IS NULL THEN mp.description ELSE mpRel.modalityParameter.upsert.description END,
    parameterKey: CASE WHEN mpRel.modalityParameter.upsert.parameterKey IS NULL THEN mp.parameterKey ELSE mpRel.modalityParameter.upsert.parameterKey END,
    valueType: CASE WHEN mpRel.modalityParameter.upsert.valueType IS NULL THEN mp.valueType ELSE mpRel.modalityParameter.upsert.valueType END,
    defaultValue: CASE WHEN mpRel.modalityParameter.upsert.defaultValue IS NULL THEN mp.defaultValue ELSE mpRel.modalityParameter.upsert.defaultValue END,
    unit: CASE WHEN mpRel.modalityParameter.upsert.unit IS NULL THEN mp.unit ELSE mpRel.modalityParameter.upsert.unit END,
    validAt: CASE WHEN mpRel.modalityParameter.upsert.validAt IS NULL THEN mp.validAt ELSE mpRel.modalityParameter.upsert.validAt END,
    invalidAt: CASE WHEN mpRel.modalityParameter.upsert.invalidAt IS NULL THEN mp.invalidAt ELSE mpRel.modalityParameter.upsert.invalidAt END,
    expiredAt: CASE WHEN mpRel.modalityParameter.upsert.expiredAt IS NULL THEN mp.expiredAt ELSE mpRel.modalityParameter.upsert.expiredAt END
  }

  MERGE (mo)-[r:HAS_PARAMETER]->(mp)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    value: CASE WHEN mpRel.value IS NULL THEN r.value ELSE mpRel.value END,
    unit: CASE WHEN mpRel.unit IS NULL THEN r.unit ELSE mpRel.unit END,
    min: CASE WHEN mpRel.min IS NULL THEN r.min ELSE mpRel.min END,
    max: CASE WHEN mpRel.max IS NULL THEN r.max ELSE mpRel.max END,
    notes: CASE WHEN mpRel.notes IS NULL THEN r.notes ELSE mpRel.notes END,
    validAt: CASE WHEN mpRel.validAt IS NULL THEN r.validAt ELSE mpRel.validAt END,
    invalidAt: CASE WHEN mpRel.invalidAt IS NULL THEN r.invalidAt ELSE mpRel.invalidAt END,
    expiredAt: CASE WHEN mpRel.expiredAt IS NULL THEN r.expiredAt ELSE mpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH mo, mpRel
  WITH mo, mpRel
  WHERE mpRel.modalityParameter.connect IS NOT NULL

  OPTIONAL MATCH (mp:ModalityParameter {modalityParameterId: mpRel.modalityParameter.connect.modalityParameterId})
  WITH mo, mpRel, mp

  CALL apoc.util.validate(
    mp IS NULL,
    'HAS_PARAMETER connect failed: ModalityParameter not found for modalityParameterId %s',
    [mpRel.modalityParameter.connect.modalityParameterId]
  )

  MERGE (mo)-[r:HAS_PARAMETER]->(mp)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    value: CASE WHEN mpRel.value IS NULL THEN r.value ELSE mpRel.value END,
    unit: CASE WHEN mpRel.unit IS NULL THEN r.unit ELSE mpRel.unit END,
    min: CASE WHEN mpRel.min IS NULL THEN r.min ELSE mpRel.min END,
    max: CASE WHEN mpRel.max IS NULL THEN r.max ELSE mpRel.max END,
    notes: CASE WHEN mpRel.notes IS NULL THEN r.notes ELSE mpRel.notes END,
    validAt: CASE WHEN mpRel.validAt IS NULL THEN r.validAt ELSE mpRel.validAt END,
    invalidAt: CASE WHEN mpRel.invalidAt IS NULL THEN r.invalidAt ELSE mpRel.invalidAt END,
    expiredAt: CASE WHEN mpRel.expiredAt IS NULL THEN r.expiredAt ELSE mpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH mo, mpRel
  WITH mo, mpRel
  WHERE mpRel.modalityParameter.connectByKey IS NOT NULL

  OPTIONAL MATCH (mp:ModalityParameter {canonicalName: mpRel.modalityParameter.connectByKey.canonicalName})
  WITH mo, mpRel, mp

  CALL apoc.util.validate(
    mp IS NULL,
    'HAS_PARAMETER connectByKey failed: ModalityParameter not found for canonicalName %s',
    [mpRel.modalityParameter.connectByKey.canonicalName]
  )

  MERGE (mo)-[r:HAS_PARAMETER]->(mp)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    value: CASE WHEN mpRel.value IS NULL THEN r.value ELSE mpRel.value END,
    unit: CASE WHEN mpRel.unit IS NULL THEN r.unit ELSE mpRel.unit END,
    min: CASE WHEN mpRel.min IS NULL THEN r.min ELSE mpRel.min END,
    max: CASE WHEN mpRel.max IS NULL THEN r.max ELSE mpRel.max END,
    notes: CASE WHEN mpRel.notes IS NULL THEN r.notes ELSE mpRel.notes END,
    validAt: CASE WHEN mpRel.validAt IS NULL THEN r.validAt ELSE mpRel.validAt END,
    invalidAt: CASE WHEN mpRel.invalidAt IS NULL THEN r.invalidAt ELSE mpRel.invalidAt END,
    expiredAt: CASE WHEN mpRel.expiredAt IS NULL THEN r.expiredAt ELSE mpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnModalityCypher = `
MATCH (mo:Modality {modalityId: $modalityId})
RETURN mo
`;

export const modalityStatements = {
  modalityInstanceOfCypher,
  modalityHasParameterCypher,
  returnModalityCypher,
};

// ============================================================================
// DEVICE
// ============================================================================

export function buildDeviceUpsertCypher(key: DeviceIdentifierKey): string {
  return `
    MERGE (dv:Device { ${key}: $idValue })
    ON CREATE SET dv.createdAt = datetime()

    SET dv.deviceId = coalesce(dv.deviceId, randomUUID())

    SET dv += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN dv.canonicalName ELSE $canonicalName END,
      aliases: CASE
        WHEN $aliases IS NULL THEN dv.aliases
        ELSE apoc.coll.toSet(coalesce(dv.aliases, []) + coalesce($aliases, []))
      END,
      description: CASE WHEN $description IS NULL THEN dv.description ELSE $description END,
      deviceClass: CASE WHEN $deviceClass IS NULL THEN dv.deviceClass ELSE $deviceClass END,
      intendedUse: CASE WHEN $intendedUse IS NULL THEN dv.intendedUse ELSE $intendedUse END,
      version: CASE WHEN $version IS NULL THEN dv.version ELSE $version END,
      validAt: CASE WHEN $validAt IS NULL THEN dv.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN dv.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN dv.expiredAt ELSE $expiredAt END
    }

    RETURN dv
  `;
}

// (Device)-[:OF_TYPE]->(DeviceType)
// Params: $deviceId, $ofType
export const deviceOfTypeCypher = `
MATCH (dv:Device {deviceId: $deviceId})

UNWIND coalesce($ofType, []) AS dtRel
CALL {
  // ---- upsert branch ----
  WITH dv, dtRel
  WITH dv, dtRel
  WHERE dtRel.deviceType.upsert IS NOT NULL

  MERGE (dt:DeviceType {deviceTypeId: coalesce(dtRel.deviceType.upsert.deviceTypeId, randomUUID())})
  ON CREATE SET dt.createdAt = datetime()

  SET dt += {
    canonicalName: CASE WHEN dtRel.deviceType.upsert.canonicalName IS NULL THEN dt.canonicalName ELSE dtRel.deviceType.upsert.canonicalName END,
    description: CASE WHEN dtRel.deviceType.upsert.description IS NULL THEN dt.description ELSE dtRel.deviceType.upsert.description END,
    deviceTypeFamily: CASE WHEN dtRel.deviceType.upsert.deviceTypeFamily IS NULL THEN dt.deviceTypeFamily ELSE dtRel.deviceType.upsert.deviceTypeFamily END,
    validAt: CASE WHEN dtRel.deviceType.upsert.validAt IS NULL THEN dt.validAt ELSE dtRel.deviceType.upsert.validAt END,
    invalidAt: CASE WHEN dtRel.deviceType.upsert.invalidAt IS NULL THEN dt.invalidAt ELSE dtRel.deviceType.upsert.invalidAt END,
    expiredAt: CASE WHEN dtRel.deviceType.upsert.expiredAt IS NULL THEN dt.expiredAt ELSE dtRel.deviceType.upsert.expiredAt END
  }

  MERGE (dv)-[r:OF_TYPE]->(dt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    validAt: CASE WHEN dtRel.validAt IS NULL THEN r.validAt ELSE dtRel.validAt END,
    invalidAt: CASE WHEN dtRel.invalidAt IS NULL THEN r.invalidAt ELSE dtRel.invalidAt END,
    expiredAt: CASE WHEN dtRel.expiredAt IS NULL THEN r.expiredAt ELSE dtRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH dv, dtRel
  WITH dv, dtRel
  WHERE dtRel.deviceType.connect IS NOT NULL

  OPTIONAL MATCH (dt:DeviceType {deviceTypeId: dtRel.deviceType.connect.deviceTypeId})
  WITH dv, dtRel, dt

  CALL apoc.util.validate(
    dt IS NULL,
    'OF_TYPE connect failed: DeviceType not found for deviceTypeId %s',
    [dtRel.deviceType.connect.deviceTypeId]
  )

  MERGE (dv)-[r:OF_TYPE]->(dt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    validAt: CASE WHEN dtRel.validAt IS NULL THEN r.validAt ELSE dtRel.validAt END,
    invalidAt: CASE WHEN dtRel.invalidAt IS NULL THEN r.invalidAt ELSE dtRel.invalidAt END,
    expiredAt: CASE WHEN dtRel.expiredAt IS NULL THEN r.expiredAt ELSE dtRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH dv, dtRel
  WITH dv, dtRel
  WHERE dtRel.deviceType.connectByKey IS NOT NULL

  OPTIONAL MATCH (dt:DeviceType {canonicalName: dtRel.deviceType.connectByKey.canonicalName})
  WITH dv, dtRel, dt

  CALL apoc.util.validate(
    dt IS NULL,
    'OF_TYPE connectByKey failed: DeviceType not found for canonicalName %s',
    [dtRel.deviceType.connectByKey.canonicalName]
  )

  MERGE (dv)-[r:OF_TYPE]->(dt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    validAt: CASE WHEN dtRel.validAt IS NULL THEN r.validAt ELSE dtRel.validAt END,
    invalidAt: CASE WHEN dtRel.invalidAt IS NULL THEN r.invalidAt ELSE dtRel.invalidAt END,
    expiredAt: CASE WHEN dtRel.expiredAt IS NULL THEN r.expiredAt ELSE dtRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Device)-[:USES_MODALITY]->(Modality)
// Params: $deviceId, $usesModality
export const deviceUsesModalityCypher = `
MATCH (dv:Device {deviceId: $deviceId})

UNWIND coalesce($usesModality, []) AS moRel
CALL {
  // ---- upsert branch ----
  WITH dv, moRel
  WITH dv, moRel
  WHERE moRel.modality.upsert IS NOT NULL

  MERGE (mo:Modality {modalityId: coalesce(moRel.modality.upsert.modalityId, randomUUID())})
  ON CREATE SET mo.createdAt = datetime()

  SET mo += {
    canonicalName: CASE WHEN moRel.modality.upsert.canonicalName IS NULL THEN mo.canonicalName ELSE moRel.modality.upsert.canonicalName END,
    description: CASE WHEN moRel.modality.upsert.description IS NULL THEN mo.description ELSE moRel.modality.upsert.description END,
    modalityRole: CASE WHEN moRel.modality.upsert.modalityRole IS NULL THEN mo.modalityRole ELSE moRel.modality.upsert.modalityRole END,
    validAt: CASE WHEN moRel.modality.upsert.validAt IS NULL THEN mo.validAt ELSE moRel.modality.upsert.validAt END,
    invalidAt: CASE WHEN moRel.modality.upsert.invalidAt IS NULL THEN mo.invalidAt ELSE moRel.modality.upsert.invalidAt END,
    expiredAt: CASE WHEN moRel.modality.upsert.expiredAt IS NULL THEN mo.expiredAt ELSE moRel.modality.upsert.expiredAt END
  }

  MERGE (dv)-[r:USES_MODALITY]->(mo)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    purpose: CASE WHEN moRel.purpose IS NULL THEN r.purpose ELSE moRel.purpose END,
    primary: CASE WHEN moRel.primary IS NULL THEN r.primary ELSE moRel.primary END,
    validAt: CASE WHEN moRel.validAt IS NULL THEN r.validAt ELSE moRel.validAt END,
    invalidAt: CASE WHEN moRel.invalidAt IS NULL THEN r.invalidAt ELSE moRel.invalidAt END,
    expiredAt: CASE WHEN moRel.expiredAt IS NULL THEN r.expiredAt ELSE moRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH dv, moRel
  WITH dv, moRel
  WHERE moRel.modality.connect IS NOT NULL

  OPTIONAL MATCH (mo:Modality {modalityId: moRel.modality.connect.modalityId})
  WITH dv, moRel, mo

  CALL apoc.util.validate(
    mo IS NULL,
    'USES_MODALITY connect failed: Modality not found for modalityId %s',
    [moRel.modality.connect.modalityId]
  )

  MERGE (dv)-[r:USES_MODALITY]->(mo)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    purpose: CASE WHEN moRel.purpose IS NULL THEN r.purpose ELSE moRel.purpose END,
    primary: CASE WHEN moRel.primary IS NULL THEN r.primary ELSE moRel.primary END,
    validAt: CASE WHEN moRel.validAt IS NULL THEN r.validAt ELSE moRel.validAt END,
    invalidAt: CASE WHEN moRel.invalidAt IS NULL THEN r.invalidAt ELSE moRel.invalidAt END,
    expiredAt: CASE WHEN moRel.expiredAt IS NULL THEN r.expiredAt ELSE moRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH dv, moRel
  WITH dv, moRel
  WHERE moRel.modality.connectByKey IS NOT NULL

  OPTIONAL MATCH (mo:Modality {canonicalName: moRel.modality.connectByKey.canonicalName})
  WITH dv, moRel, mo

  CALL apoc.util.validate(
    mo IS NULL,
    'USES_MODALITY connectByKey failed: Modality not found for canonicalName %s',
    [moRel.modality.connectByKey.canonicalName]
  )

  MERGE (dv)-[r:USES_MODALITY]->(mo)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    purpose: CASE WHEN moRel.purpose IS NULL THEN r.purpose ELSE moRel.purpose END,
    primary: CASE WHEN moRel.primary IS NULL THEN r.primary ELSE moRel.primary END,
    validAt: CASE WHEN moRel.validAt IS NULL THEN r.validAt ELSE moRel.validAt END,
    invalidAt: CASE WHEN moRel.invalidAt IS NULL THEN r.invalidAt ELSE moRel.invalidAt END,
    expiredAt: CASE WHEN moRel.expiredAt IS NULL THEN r.expiredAt ELSE moRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Device)-[:HAS_SENSOR]->(Sensor)
// Params: $deviceId, $hasSensor
export const deviceHasSensorCypher = `
MATCH (dv:Device {deviceId: $deviceId})

UNWIND coalesce($hasSensor, []) AS snRel
CALL {
  // ---- upsert branch ----
  WITH dv, snRel
  WITH dv, snRel
  WHERE snRel.sensor.upsert IS NOT NULL

  MERGE (sn:Sensor {sensorId: coalesce(snRel.sensor.upsert.sensorId, randomUUID())})
  ON CREATE SET sn.createdAt = datetime()

  SET sn += {
    canonicalName: CASE WHEN snRel.sensor.upsert.canonicalName IS NULL THEN sn.canonicalName ELSE snRel.sensor.upsert.canonicalName END,
    aliases: CASE
      WHEN snRel.sensor.upsert.aliases IS NULL THEN sn.aliases
      ELSE apoc.coll.toSet(coalesce(sn.aliases, []) + coalesce(snRel.sensor.upsert.aliases, []))
    END,
    description: CASE WHEN snRel.sensor.upsert.description IS NULL THEN sn.description ELSE snRel.sensor.upsert.description END,
    sensorType: CASE WHEN snRel.sensor.upsert.sensorType IS NULL THEN sn.sensorType ELSE snRel.sensor.upsert.sensorType END,
    validAt: CASE WHEN snRel.sensor.upsert.validAt IS NULL THEN sn.validAt ELSE snRel.sensor.upsert.validAt END,
    invalidAt: CASE WHEN snRel.sensor.upsert.invalidAt IS NULL THEN sn.invalidAt ELSE snRel.sensor.upsert.invalidAt END,
    expiredAt: CASE WHEN snRel.sensor.upsert.expiredAt IS NULL THEN sn.expiredAt ELSE snRel.sensor.upsert.expiredAt END
  }

  MERGE (dv)-[r:HAS_SENSOR]->(sn)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    count: CASE WHEN snRel.count IS NULL THEN r.count ELSE snRel.count END,
    location: CASE WHEN snRel.location IS NULL THEN r.location ELSE snRel.location END,
    validAt: CASE WHEN snRel.validAt IS NULL THEN r.validAt ELSE snRel.validAt END,
    invalidAt: CASE WHEN snRel.invalidAt IS NULL THEN r.invalidAt ELSE snRel.invalidAt END,
    expiredAt: CASE WHEN snRel.expiredAt IS NULL THEN r.expiredAt ELSE snRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH dv, snRel
  WITH dv, snRel
  WHERE snRel.sensor.connect IS NOT NULL

  OPTIONAL MATCH (sn:Sensor {sensorId: snRel.sensor.connect.sensorId})
  WITH dv, snRel, sn

  CALL apoc.util.validate(
    sn IS NULL,
    'HAS_SENSOR connect failed: Sensor not found for sensorId %s',
    [snRel.sensor.connect.sensorId]
  )

  MERGE (dv)-[r:HAS_SENSOR]->(sn)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    count: CASE WHEN snRel.count IS NULL THEN r.count ELSE snRel.count END,
    location: CASE WHEN snRel.location IS NULL THEN r.location ELSE snRel.location END,
    validAt: CASE WHEN snRel.validAt IS NULL THEN r.validAt ELSE snRel.validAt END,
    invalidAt: CASE WHEN snRel.invalidAt IS NULL THEN r.invalidAt ELSE snRel.invalidAt END,
    expiredAt: CASE WHEN snRel.expiredAt IS NULL THEN r.expiredAt ELSE snRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH dv, snRel
  WITH dv, snRel
  WHERE snRel.sensor.connectByKey IS NOT NULL

  OPTIONAL MATCH (sn:Sensor {canonicalName: snRel.sensor.connectByKey.canonicalName})
  WITH dv, snRel, sn

  CALL apoc.util.validate(
    sn IS NULL,
    'HAS_SENSOR connectByKey failed: Sensor not found for canonicalName %s',
    [snRel.sensor.connectByKey.canonicalName]
  )

  MERGE (dv)-[r:HAS_SENSOR]->(sn)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    count: CASE WHEN snRel.count IS NULL THEN r.count ELSE snRel.count END,
    location: CASE WHEN snRel.location IS NULL THEN r.location ELSE snRel.location END,
    validAt: CASE WHEN snRel.validAt IS NULL THEN r.validAt ELSE snRel.validAt END,
    invalidAt: CASE WHEN snRel.invalidAt IS NULL THEN r.invalidAt ELSE snRel.invalidAt END,
    expiredAt: CASE WHEN snRel.expiredAt IS NULL THEN r.expiredAt ELSE snRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Device)-[:IMPLEMENTS_PLATFORM]->(TechnologyPlatform)
// Params: $deviceId, $implementsPlatform
export const deviceImplementsPlatformCypher = `
MATCH (dv:Device {deviceId: $deviceId})

UNWIND coalesce($implementsPlatform, []) AS tpRel
CALL {
  // ---- upsert branch ----
  WITH dv, tpRel
  WITH dv, tpRel
  WHERE tpRel.technologyPlatform.upsert IS NOT NULL

  MERGE (tp:TechnologyPlatform {platformId: coalesce(tpRel.technologyPlatform.upsert.platformId, randomUUID())})
  ON CREATE SET tp.createdAt = datetime()

  SET tp += {
    canonicalName: CASE WHEN tpRel.technologyPlatform.upsert.canonicalName IS NULL THEN tp.canonicalName ELSE tpRel.technologyPlatform.upsert.canonicalName END,
    aliases: CASE
      WHEN tpRel.technologyPlatform.upsert.aliases IS NULL THEN tp.aliases
      ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(tpRel.technologyPlatform.upsert.aliases, []))
    END,
    platformType: CASE WHEN tpRel.technologyPlatform.upsert.platformType IS NULL THEN tp.platformType ELSE tpRel.technologyPlatform.upsert.platformType END,
    description: CASE WHEN tpRel.technologyPlatform.upsert.description IS NULL THEN tp.description ELSE tpRel.technologyPlatform.upsert.description END,
    validAt: CASE WHEN tpRel.technologyPlatform.upsert.validAt IS NULL THEN tp.validAt ELSE tpRel.technologyPlatform.upsert.validAt END,
    invalidAt: CASE WHEN tpRel.technologyPlatform.upsert.invalidAt IS NULL THEN tp.invalidAt ELSE tpRel.technologyPlatform.upsert.invalidAt END,
    expiredAt: CASE WHEN tpRel.technologyPlatform.upsert.expiredAt IS NULL THEN tp.expiredAt ELSE tpRel.technologyPlatform.upsert.expiredAt END
  }

  MERGE (dv)-[r:IMPLEMENTS_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    notes: CASE WHEN tpRel.notes IS NULL THEN r.notes ELSE tpRel.notes END,
    validAt: CASE WHEN tpRel.validAt IS NULL THEN r.validAt ELSE tpRel.validAt END,
    invalidAt: CASE WHEN tpRel.invalidAt IS NULL THEN r.invalidAt ELSE tpRel.invalidAt END,
    expiredAt: CASE WHEN tpRel.expiredAt IS NULL THEN r.expiredAt ELSE tpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH dv, tpRel
  WITH dv, tpRel
  WHERE tpRel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp:TechnologyPlatform {platformId: tpRel.technologyPlatform.connect.platformId})
  WITH dv, tpRel, tp

  CALL apoc.util.validate(
    tp IS NULL,
    'IMPLEMENTS_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [tpRel.technologyPlatform.connect.platformId]
  )

  MERGE (dv)-[r:IMPLEMENTS_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    notes: CASE WHEN tpRel.notes IS NULL THEN r.notes ELSE tpRel.notes END,
    validAt: CASE WHEN tpRel.validAt IS NULL THEN r.validAt ELSE tpRel.validAt END,
    invalidAt: CASE WHEN tpRel.invalidAt IS NULL THEN r.invalidAt ELSE tpRel.invalidAt END,
    expiredAt: CASE WHEN tpRel.expiredAt IS NULL THEN r.expiredAt ELSE tpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH dv, tpRel
  WITH dv, tpRel
  WHERE tpRel.technologyPlatform.connectByKey IS NOT NULL

  OPTIONAL MATCH (tp:TechnologyPlatform {canonicalName: tpRel.technologyPlatform.connectByKey.canonicalName})
  WITH dv, tpRel, tp

  CALL apoc.util.validate(
    tp IS NULL,
    'IMPLEMENTS_PLATFORM connectByKey failed: TechnologyPlatform not found for canonicalName %s',
    [tpRel.technologyPlatform.connectByKey.canonicalName]
  )

  MERGE (dv)-[r:IMPLEMENTS_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    notes: CASE WHEN tpRel.notes IS NULL THEN r.notes ELSE tpRel.notes END,
    validAt: CASE WHEN tpRel.validAt IS NULL THEN r.validAt ELSE tpRel.validAt END,
    invalidAt: CASE WHEN tpRel.invalidAt IS NULL THEN r.invalidAt ELSE tpRel.invalidAt END,
    expiredAt: CASE WHEN tpRel.expiredAt IS NULL THEN r.expiredAt ELSE tpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Device)-[:MEASURES_METRIC]->(FunctionalMetric)
// Params: $deviceId, $measuresMetric
export const deviceMeasuresMetricCypher = `
MATCH (dv:Device {deviceId: $deviceId})

UNWIND coalesce($measuresMetric, []) AS fmRel
CALL {
  // ---- upsert branch ----
  WITH dv, fmRel
  WITH dv, fmRel
  WHERE fmRel.functionalMetric.upsert IS NOT NULL

  MERGE (fm:FunctionalMetric {functionalMetricId: coalesce(fmRel.functionalMetric.upsert.functionalMetricId, randomUUID())})
  ON CREATE SET fm.createdAt = datetime()

  SET fm += {
    canonicalName: CASE WHEN fmRel.functionalMetric.upsert.canonicalName IS NULL THEN fm.canonicalName ELSE fmRel.functionalMetric.upsert.canonicalName END,
    aliases: CASE
      WHEN fmRel.functionalMetric.upsert.aliases IS NULL THEN fm.aliases
      ELSE apoc.coll.toSet(coalesce(fm.aliases, []) + coalesce(fmRel.functionalMetric.upsert.aliases, []))
    END,
    description: CASE WHEN fmRel.functionalMetric.upsert.description IS NULL THEN fm.description ELSE fmRel.functionalMetric.upsert.description END,
    metricType: CASE WHEN fmRel.functionalMetric.upsert.metricType IS NULL THEN fm.metricType ELSE fmRel.functionalMetric.upsert.metricType END,
    unit: CASE WHEN fmRel.functionalMetric.upsert.unit IS NULL THEN fm.unit ELSE fmRel.functionalMetric.upsert.unit END,
    valueType: CASE WHEN fmRel.functionalMetric.upsert.valueType IS NULL THEN fm.valueType ELSE fmRel.functionalMetric.upsert.valueType END,
    validAt: CASE WHEN fmRel.functionalMetric.upsert.validAt IS NULL THEN fm.validAt ELSE fmRel.functionalMetric.upsert.validAt END,
    invalidAt: CASE WHEN fmRel.functionalMetric.upsert.invalidAt IS NULL THEN fm.invalidAt ELSE fmRel.functionalMetric.upsert.invalidAt END,
    expiredAt: CASE WHEN fmRel.functionalMetric.upsert.expiredAt IS NULL THEN fm.expiredAt ELSE fmRel.functionalMetric.upsert.expiredAt END
  }

  MERGE (dv)-[r:MEASURES_METRIC]->(fm)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    method: CASE WHEN fmRel.method IS NULL THEN r.method ELSE fmRel.method END,
    accuracy: CASE WHEN fmRel.accuracy IS NULL THEN r.accuracy ELSE fmRel.accuracy END,
    rangeMin: CASE WHEN fmRel.rangeMin IS NULL THEN r.rangeMin ELSE fmRel.rangeMin END,
    rangeMax: CASE WHEN fmRel.rangeMax IS NULL THEN r.rangeMax ELSE fmRel.rangeMax END,
    unit: CASE WHEN fmRel.unit IS NULL THEN r.unit ELSE fmRel.unit END,
    validAt: CASE WHEN fmRel.validAt IS NULL THEN r.validAt ELSE fmRel.validAt END,
    invalidAt: CASE WHEN fmRel.invalidAt IS NULL THEN r.invalidAt ELSE fmRel.invalidAt END,
    expiredAt: CASE WHEN fmRel.expiredAt IS NULL THEN r.expiredAt ELSE fmRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH dv, fmRel
  WITH dv, fmRel
  WHERE fmRel.functionalMetric.connect IS NOT NULL

  OPTIONAL MATCH (fm:FunctionalMetric {functionalMetricId: fmRel.functionalMetric.connect.functionalMetricId})
  WITH dv, fmRel, fm

  CALL apoc.util.validate(
    fm IS NULL,
    'MEASURES_METRIC connect failed: FunctionalMetric not found for functionalMetricId %s',
    [fmRel.functionalMetric.connect.functionalMetricId]
  )

  MERGE (dv)-[r:MEASURES_METRIC]->(fm)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    method: CASE WHEN fmRel.method IS NULL THEN r.method ELSE fmRel.method END,
    accuracy: CASE WHEN fmRel.accuracy IS NULL THEN r.accuracy ELSE fmRel.accuracy END,
    rangeMin: CASE WHEN fmRel.rangeMin IS NULL THEN r.rangeMin ELSE fmRel.rangeMin END,
    rangeMax: CASE WHEN fmRel.rangeMax IS NULL THEN r.rangeMax ELSE fmRel.rangeMax END,
    unit: CASE WHEN fmRel.unit IS NULL THEN r.unit ELSE fmRel.unit END,
    validAt: CASE WHEN fmRel.validAt IS NULL THEN r.validAt ELSE fmRel.validAt END,
    invalidAt: CASE WHEN fmRel.invalidAt IS NULL THEN r.invalidAt ELSE fmRel.invalidAt END,
    expiredAt: CASE WHEN fmRel.expiredAt IS NULL THEN r.expiredAt ELSE fmRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH dv, fmRel
  WITH dv, fmRel
  WHERE fmRel.functionalMetric.connectByKey IS NOT NULL

  OPTIONAL MATCH (fm:FunctionalMetric {canonicalName: fmRel.functionalMetric.connectByKey.canonicalName})
  WITH dv, fmRel, fm

  CALL apoc.util.validate(
    fm IS NULL,
    'MEASURES_METRIC connectByKey failed: FunctionalMetric not found for canonicalName %s',
    [fmRel.functionalMetric.connectByKey.canonicalName]
  )

  MERGE (dv)-[r:MEASURES_METRIC]->(fm)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    method: CASE WHEN fmRel.method IS NULL THEN r.method ELSE fmRel.method END,
    accuracy: CASE WHEN fmRel.accuracy IS NULL THEN r.accuracy ELSE fmRel.accuracy END,
    rangeMin: CASE WHEN fmRel.rangeMin IS NULL THEN r.rangeMin ELSE fmRel.rangeMin END,
    rangeMax: CASE WHEN fmRel.rangeMax IS NULL THEN r.rangeMax ELSE fmRel.rangeMax END,
    unit: CASE WHEN fmRel.unit IS NULL THEN r.unit ELSE fmRel.unit END,
    validAt: CASE WHEN fmRel.validAt IS NULL THEN r.validAt ELSE fmRel.validAt END,
    invalidAt: CASE WHEN fmRel.invalidAt IS NULL THEN r.invalidAt ELSE fmRel.invalidAt END,
    expiredAt: CASE WHEN fmRel.expiredAt IS NULL THEN r.expiredAt ELSE fmRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnDeviceCypher = `
MATCH (dv:Device {deviceId: $deviceId})
RETURN dv
`;

export const deviceStatements = {
  deviceOfTypeCypher,
  deviceUsesModalityCypher,
  deviceHasSensorCypher,
  deviceImplementsPlatformCypher,
  deviceMeasuresMetricCypher,
  returnDeviceCypher,
};
