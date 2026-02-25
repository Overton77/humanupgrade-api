import {
  DeviceIdentifierKey,
  DeviceTypeIdentifierKey,
  FunctionalMetricIdentifierKey,
  ModalityIdentifierKey,
  ModalityParameterIdentifierKey,
  ModalityTypeIdentifierKey,
  SensorIdentifierKey,
} from "../types.js";

export function resolveFunctionalMetricIdentifier(params: {
  functionalMetricId?: string | null;
  canonicalName?: string | null;
}): { key: FunctionalMetricIdentifierKey; value: string } {
  if (params.functionalMetricId)
    return { key: "functionalMetricId", value: params.functionalMetricId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "FunctionalMetric identifier required: functionalMetricId or canonicalName"
  );
}

export function resolveDeviceTypeIdentifier(params: {
  deviceTypeId?: string | null;
  canonicalName?: string | null;
}): { key: DeviceTypeIdentifierKey; value: string } {
  if (params.deviceTypeId)
    return { key: "deviceTypeId", value: params.deviceTypeId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "DeviceType identifier required: deviceTypeId or canonicalName"
  );
}

export function resolveModalityTypeIdentifier(params: {
  modalityTypeId?: string | null;
  canonicalName?: string | null;
}): { key: ModalityTypeIdentifierKey; value: string } {
  if (params.modalityTypeId)
    return { key: "modalityTypeId", value: params.modalityTypeId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "ModalityType identifier required: modalityTypeId or canonicalName"
  );
}

export function resolveModalityParameterIdentifier(params: {
  modalityParameterId?: string | null;
  canonicalName?: string | null;
}): { key: ModalityParameterIdentifierKey; value: string } {
  if (params.modalityParameterId)
    return { key: "modalityParameterId", value: params.modalityParameterId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "ModalityParameter identifier required: modalityParameterId or canonicalName"
  );
}

export function resolveSensorIdentifier(params: {
  sensorId?: string | null;
  canonicalName?: string | null;
}): { key: SensorIdentifierKey; value: string } {
  if (params.sensorId) return { key: "sensorId", value: params.sensorId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error("Sensor identifier required: sensorId or canonicalName");
}

export function resolveModalityIdentifier(params: {
  modalityId?: string | null;
  canonicalName?: string | null;
}): { key: ModalityIdentifierKey; value: string } {
  if (params.modalityId)
    return { key: "modalityId", value: params.modalityId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error("Modality identifier required: modalityId or canonicalName");
}

export function resolveDeviceIdentifier(params: {
  deviceId?: string | null;
  canonicalName?: string | null;
}): { key: DeviceIdentifierKey; value: string } {
  if (params.deviceId) return { key: "deviceId", value: params.deviceId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error("Device identifier required: deviceId or canonicalName");
}
