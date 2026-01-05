import z from "zod";
import { LocationTypeEnum } from "../enums/index.js";

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
});

export type PhysicalLocation = z.infer<typeof PhysicalLocationSchema>;
