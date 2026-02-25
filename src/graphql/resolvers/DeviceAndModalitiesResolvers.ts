import { Device } from "../types/DeviceModel.js";
import { DeviceType } from "../types/DeviceTypeModel.js";
import { FunctionalMetric } from "../types/FunctionalMetricModel.js";
import { Sensor } from "../types/SensorModel.js";
import { Modality } from "../types/ModalityModel.js";
import { ModalityType } from "../types/ModalityTypeModel.js";
import { ModalityParameter } from "../types/ModalityParameterModel.js";
import {
  UpsertDeviceInput,
  UpsertDeviceTypeInput,
  UpsertFunctionalMetricInput,
  UpsertModalityInput,
  UpsertModalityTypeInput,
  UpsertSensorInput,
} from "../inputs/DevicesAndModalitiesInputs.js";
import {
  upsertFunctionalMetric,
  upsertDeviceType,
  upsertModalityType,
  upsertSensor,
  upsertModality,
  upsertDevice,
} from "../../services/Devices/deviceAndModalitiesService.js";

export const DeviceAndModalitiesResolvers = {
  upsertFunctionalMetric: async (
    input: UpsertFunctionalMetricInput,
  ): Promise<FunctionalMetric> => {
    const functionalMetric = await upsertFunctionalMetric(input);
    return functionalMetric;
  },
  upsertDeviceType: async (
    input: UpsertDeviceTypeInput,
  ): Promise<DeviceType> => {
    const deviceType = await upsertDeviceType(input);
    return deviceType;
  },
  upsertModalityType: async (
    input: UpsertModalityTypeInput,
  ): Promise<ModalityType> => {
    const modalityType = await upsertModalityType(input);
    return modalityType;
  },
  upsertSensor: async (input: UpsertSensorInput): Promise<Sensor> => {
    const sensor = await upsertSensor(input);
    return sensor;
  },
  upsertModality: async (input: UpsertModalityInput): Promise<Modality> => {
    const modality = await upsertModality(input);
    return modality;
  },
  upsertDevice: async (input: UpsertDeviceInput): Promise<Device> => {
    const device = await upsertDevice(input);
    return device;
  },
};
