import z from "zod";
import { LocationTypeEnum } from "../enums/index.js";  
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

export const PhysicalLocationSchema = z.object({
  locationId: z.string(),
  canonicalName: z.string(),
  locationType: LocationTypeEnum,
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  geoLat: z.number().nullable(),
  geoLon: z.number().nullable(),
  timezone: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  placeTags: z.array(z.string()).nullable(),
  hoursOfOperation: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type PhysicalLocation = z.infer<typeof PhysicalLocationSchema>;
