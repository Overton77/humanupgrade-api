import z from "zod";
import { LocationTypeEnum } from "../enums/index.js";

export const PhysicalLocationInputSchema = z.object({
  locationId: z.string().optional(), // Optional for create, will be generated if not provided
  canonicalName: z.string(),
  locationType: LocationTypeEnum,
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  geoLat: z.number().nullable().optional(),
  geoLon: z.number().nullable().optional(),
  timezone: z.string().nullable().optional(),
  jurisdiction: z.string().nullable().optional(),
  placeTags: z.array(z.string()).nullable().optional(),
  hoursOfOperation: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
});

export type PhysicalLocationInput = z.infer<typeof PhysicalLocationInputSchema>;

export const PhysicalLocationUpdateInputSchema =
  PhysicalLocationInputSchema.partial().extend({
    locationId: z.string().optional(), // Keep ID as optional for updates
  });

export type PhysicalLocationUpdateInput = z.infer<
  typeof PhysicalLocationUpdateInputSchema
>;

export const PhysicalLocationRelateInputSchema = z
  .object({
    create: PhysicalLocationInputSchema.optional(),
    connect: z.object({ locationId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// HasLocationRelationshipUpdateInput (Create/Connect/Update)
export const PhysicalLocationRelateUpdateInputSchema = z
  .object({
    create: PhysicalLocationInputSchema.optional(),
    connect: z.object({ locationId: z.string() }).optional(),
    update: PhysicalLocationUpdateInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.create ? 1 : 0) + (data.connect ? 1 : 0) + (data.update ? 1 : 0) ===
      1,
    {
      message:
        "Exactly one of 'create', 'connect', or 'update' must be provided",
    }
  );
