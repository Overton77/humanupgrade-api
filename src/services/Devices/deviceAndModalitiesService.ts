import { executeWrite } from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import { Errors } from "../../lib/errors.js";
import {
  UpsertFunctionalMetricInput,
  UpsertFunctionalMetricInputSchema,
  UpsertDeviceTypeInput,
  UpsertDeviceTypeInputSchema,
  UpsertModalityTypeInput,
  UpsertModalityTypeInputSchema,
  UpsertSensorInput,
  UpsertSensorInputSchema,
  UpsertModalityInput,
  UpsertModalityInputSchema,
  UpsertDeviceInput,
  UpsertDeviceInputSchema,
} from "../../graphql/inputs/DevicesAndModalitiesInputs.js";
import { FunctionalMetric } from "../../graphql/types/FunctionalMetricModel.js";
import { DeviceType } from "../../graphql/types/DeviceTypeModel.js";
import { ModalityType } from "../../graphql/types/ModalityTypeModel.js";
import { Sensor } from "../../graphql/types/SensorModel.js";
import { Modality } from "../../graphql/types/ModalityModel.js";
import { Device } from "../../graphql/types/DeviceModel.js";
import {
  buildFunctionalMetricUpsertCypher,
  functionalMetricStatements,
  buildDeviceTypeUpsertCypher,
  deviceTypeStatements,
  buildModalityTypeUpsertCypher,
  modalityTypeStatements,
  buildSensorUpsertCypher,
  sensorStatements,
  buildModalityUpsertCypher,
  modalityStatements,
  buildDeviceUpsertCypher,
  deviceStatements,
} from "./statements/upsertDevicesAndModalitiesStatements.js";
import {
  resolveFunctionalMetricIdentifier,
  resolveDeviceTypeIdentifier,
  resolveModalityTypeIdentifier,
  resolveSensorIdentifier,
  resolveModalityIdentifier,
  resolveDeviceIdentifier,
} from "./utils/resolveDeviceIdentities.js";

// ============================================================================
// FUNCTIONAL METRIC
// ============================================================================

export async function upsertFunctionalMetric(
  input: UpsertFunctionalMetricInput
): Promise<FunctionalMetric> {
  const validated = validateInput(
    UpsertFunctionalMetricInputSchema,
    input,
    "UpsertFunctionalMetricInput"
  );

  const params = {
    functionalMetricId: validated.functionalMetricId ?? null,
    canonicalName: validated.canonicalName,
    aliases: validated.aliases ?? null,
    description: validated.description ?? null,
    metricType: validated.metricType ?? null,
    unit: validated.unit ?? null,
    valueType: validated.valueType ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
  };

  const { key, value } = resolveFunctionalMetricIdentifier(params);
  const upsertCypher = buildFunctionalMetricUpsertCypher(key);

  try {
    const functionalMetric = await executeWrite(async (tx) => {
      // 1) Upsert FunctionalMetric node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error(
          "upsertFunctionalMetric: no record returned from upsert"
        );

      const fmNode = upsertRecord.get("fm");
      const resolvedId =
        fmNode?.properties?.functionalMetricId ?? fmNode?.functionalMetricId;

      if (!resolvedId)
        throw Errors.internalError("Upsert did not produce a functionalMetricId");

      // 2) Return FunctionalMetric
      const finalRes = await tx.run(
        functionalMetricStatements.returnFunctionalMetricCypher,
        { functionalMetricId: resolvedId }
      );
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error(
          "upsertFunctionalMetric: node not found after write"
        );

      const node = finalRecord.get("fm");
      return node?.properties ?? node;
    });

    return functionalMetric as FunctionalMetric;
  } catch (err: any) {
    logger.error("upsertFunctionalMetric: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// DEVICE TYPE
// ============================================================================

export async function upsertDeviceType(
  input: UpsertDeviceTypeInput
): Promise<DeviceType> {
  const validated = validateInput(
    UpsertDeviceTypeInputSchema,
    input,
    "UpsertDeviceTypeInput"
  );

  const params = {
    deviceTypeId: validated.deviceTypeId ?? null,
    canonicalName: validated.canonicalName,
    description: validated.description ?? null,
    deviceTypeFamily: validated.deviceTypeFamily ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
  };

  const { key, value } = resolveDeviceTypeIdentifier(params);
  const upsertCypher = buildDeviceTypeUpsertCypher(key);

  try {
    const deviceType = await executeWrite(async (tx) => {
      // 1) Upsert DeviceType node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertDeviceType: no record returned from upsert");

      const dtNode = upsertRecord.get("dt");
      const resolvedId =
        dtNode?.properties?.deviceTypeId ?? dtNode?.deviceTypeId;

      if (!resolvedId)
        throw Errors.internalError("Upsert did not produce a deviceTypeId");

      // 2) Return DeviceType
      const finalRes = await tx.run(
        deviceTypeStatements.returnDeviceTypeCypher,
        { deviceTypeId: resolvedId }
      );
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertDeviceType: node not found after write");

      const node = finalRecord.get("dt");
      return node?.properties ?? node;
    });

    return deviceType as DeviceType;
  } catch (err: any) {
    logger.error("upsertDeviceType: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// MODALITY TYPE
// ============================================================================

export async function upsertModalityType(
  input: UpsertModalityTypeInput
): Promise<ModalityType> {
  const validated = validateInput(
    UpsertModalityTypeInputSchema,
    input,
    "UpsertModalityTypeInput"
  );

  const params = {
    modalityTypeId: validated.modalityTypeId ?? null,
    canonicalName: validated.canonicalName,
    description: validated.description ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
  };

  const { key, value } = resolveModalityTypeIdentifier(params);
  const upsertCypher = buildModalityTypeUpsertCypher(key);

  try {
    const modalityType = await executeWrite(async (tx) => {
      // 1) Upsert ModalityType node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertModalityType: no record returned from upsert");

      const mtNode = upsertRecord.get("mt");
      const resolvedId =
        mtNode?.properties?.modalityTypeId ?? mtNode?.modalityTypeId;

      if (!resolvedId)
        throw Errors.internalError("Upsert did not produce a modalityTypeId");

      // 2) Return ModalityType
      const finalRes = await tx.run(
        modalityTypeStatements.returnModalityTypeCypher,
        { modalityTypeId: resolvedId }
      );
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertModalityType: node not found after write");

      const node = finalRecord.get("mt");
      return node?.properties ?? node;
    });

    return modalityType as ModalityType;
  } catch (err: any) {
    logger.error("upsertModalityType: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// SENSOR
// ============================================================================

export async function upsertSensor(input: UpsertSensorInput): Promise<Sensor> {
  const validated = validateInput(
    UpsertSensorInputSchema,
    input,
    "UpsertSensorInput"
  );

  const params = {
    sensorId: validated.sensorId ?? null,
    canonicalName: validated.canonicalName,
    aliases: validated.aliases ?? null,
    description: validated.description ?? null,
    sensorType: validated.sensorType ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    measuresMetric: validated.measuresMetric ?? [],
  };

  const { key, value } = resolveSensorIdentifier(params);
  const upsertCypher = buildSensorUpsertCypher(key);

  try {
    const sensor = await executeWrite(async (tx) => {
      // 1) Upsert Sensor node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertSensor: no record returned from upsert");

      const snNode = upsertRecord.get("sn");
      const resolvedSensorId =
        snNode?.properties?.sensorId ?? snNode?.sensorId;

      if (!resolvedSensorId)
        throw Errors.internalError("Upsert did not produce a sensorId");

      const nextParams = { ...params, sensorId: resolvedSensorId };

      // 2) MEASURES_METRIC edges
      if (nextParams.measuresMetric.length) {
        await tx.run(sensorStatements.sensorMeasuresMetricCypher, nextParams);
      }

      // 3) Return Sensor
      const finalRes = await tx.run(sensorStatements.returnSensorCypher, {
        sensorId: resolvedSensorId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertSensor: sensor not found after writes");

      const node = finalRecord.get("sn");
      return node?.properties ?? node;
    });

    return sensor as Sensor;
  } catch (err: any) {
    logger.error("upsertSensor: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// MODALITY
// ============================================================================

export async function upsertModality(
  input: UpsertModalityInput
): Promise<Modality> {
  const validated = validateInput(
    UpsertModalityInputSchema,
    input,
    "UpsertModalityInput"
  );

  const params = {
    modalityId: validated.modalityId ?? null,
    canonicalName: validated.canonicalName,
    description: validated.description ?? null,
    modalityRole: validated.modalityRole ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    instanceOf: validated.instanceOf ?? [],
    hasParameter: validated.hasParameter ?? [],
  };

  const { key, value } = resolveModalityIdentifier(params);
  const upsertCypher = buildModalityUpsertCypher(key);

  try {
    const modality = await executeWrite(async (tx) => {
      // 1) Upsert Modality node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertModality: no record returned from upsert");

      const moNode = upsertRecord.get("mo");
      const resolvedModalityId =
        moNode?.properties?.modalityId ?? moNode?.modalityId;

      if (!resolvedModalityId)
        throw Errors.internalError("Upsert did not produce a modalityId");

      const nextParams = { ...params, modalityId: resolvedModalityId };

      // 2) INSTANCE_OF edges
      if (nextParams.instanceOf.length) {
        await tx.run(modalityStatements.modalityInstanceOfCypher, nextParams);
      }

      // 3) HAS_PARAMETER edges
      if (nextParams.hasParameter.length) {
        await tx.run(
          modalityStatements.modalityHasParameterCypher,
          nextParams
        );
      }

      // 4) Return Modality
      const finalRes = await tx.run(modalityStatements.returnModalityCypher, {
        modalityId: resolvedModalityId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertModality: modality not found after writes");

      const node = finalRecord.get("mo");
      return node?.properties ?? node;
    });

    return modality as Modality;
  } catch (err: any) {
    logger.error("upsertModality: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// DEVICE
// ============================================================================

export async function upsertDevice(input: UpsertDeviceInput): Promise<Device> {
  const validated = validateInput(
    UpsertDeviceInputSchema,
    input,
    "UpsertDeviceInput"
  );

  const params = {
    deviceId: validated.deviceId ?? null,
    canonicalName: validated.canonicalName,
    aliases: validated.aliases ?? null,
    description: validated.description ?? null,
    deviceClass: validated.deviceClass ?? null,
    intendedUse: validated.intendedUse ?? null,
    version: validated.version ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    ofType: validated.ofType ?? [],
    usesModality: validated.usesModality ?? [],
    hasSensor: validated.hasSensor ?? [],
    implementsPlatform: validated.implementsPlatform ?? [],
    measuresMetric: validated.measuresMetric ?? [],
  };

  const { key, value } = resolveDeviceIdentifier(params);
  const upsertCypher = buildDeviceUpsertCypher(key);

  try {
    const device = await executeWrite(async (tx) => {
      // 1) Upsert Device node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertDevice: no record returned from upsert");

      const dvNode = upsertRecord.get("dv");
      const resolvedDeviceId = dvNode?.properties?.deviceId ?? dvNode?.deviceId;

      if (!resolvedDeviceId)
        throw Errors.internalError("Upsert did not produce a deviceId");

      const nextParams = { ...params, deviceId: resolvedDeviceId };

      // 2) OF_TYPE edges
      if (nextParams.ofType.length) {
        await tx.run(deviceStatements.deviceOfTypeCypher, nextParams);
      }

      // 3) USES_MODALITY edges
      if (nextParams.usesModality.length) {
        await tx.run(deviceStatements.deviceUsesModalityCypher, nextParams);
      }

      // 4) HAS_SENSOR edges
      if (nextParams.hasSensor.length) {
        await tx.run(deviceStatements.deviceHasSensorCypher, nextParams);
      }

      // 5) IMPLEMENTS_PLATFORM edges
      if (nextParams.implementsPlatform.length) {
        await tx.run(
          deviceStatements.deviceImplementsPlatformCypher,
          nextParams
        );
      }

      // 6) MEASURES_METRIC edges
      if (nextParams.measuresMetric.length) {
        await tx.run(deviceStatements.deviceMeasuresMetricCypher, nextParams);
      }

      // 7) Return Device
      const finalRes = await tx.run(deviceStatements.returnDeviceCypher, {
        deviceId: resolvedDeviceId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertDevice: device not found after writes");

      const node = finalRecord.get("dv");
      return node?.properties ?? node;
    });

    return device as Device;
  } catch (err: any) {
    logger.error("upsertDevice: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}
