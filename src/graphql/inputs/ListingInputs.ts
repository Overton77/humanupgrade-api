import z from "zod";
import {
  ListingDomainEnum,
  PriceTypeEnum,
  CollectionModeEnum,
} from "../enums/index.js";

export const ListingInputSchema = z.object({
  listingId: z.string().optional(),
  listingDomain: ListingDomainEnum,
  title: z.string(),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  brandName: z.string().nullable().optional(),
  currency: z.string(),
  priceAmount: z.number().nullable().optional(),
  priceType: PriceTypeEnum.nullable().optional(),
  pricingNotes: z.string().nullable().optional(),
  constraints: z.string().nullable().optional(),
  regionsAvailable: z.array(z.string()).nullable().optional(),
  requiresAppointment: z.boolean().nullable().optional(),
  collectionMode: CollectionModeEnum.nullable().optional(),
  turnaroundTime: z.string().nullable().optional(),
});

export type ListingInput = z.infer<typeof ListingInputSchema>;

export const ListingUpdateInputSchema = ListingInputSchema.partial().extend({
  listingId: z.string().optional(),
});

export type ListingUpdateInput = z.infer<typeof ListingUpdateInputSchema>;

export const ListingRelateInputSchema = z
  .object({
    create: ListingInputSchema.optional(),
    connect: z.object({ listingId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ListsRelationshipUpdateInput (Create/Connect/Update)
export const ListingRelateUpdateInputSchema = z
  .object({
    create: ListingInputSchema.optional(),
    connect: z.object({ listingId: z.string() }).optional(),
    update: ListingUpdateInputSchema.optional(),
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
