import { z } from "zod";
import { DeviceTypeFamilyEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// DeviceType Schema
// ============================================================================

export const DeviceTypeSchema = z.object({
  deviceTypeId: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  deviceTypeFamily: DeviceTypeFamilyEnum.nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type DeviceType = z.infer<typeof DeviceTypeSchema>;
