import z from "zod";
import { ListingDomainEnum, PriceTypeEnum } from "../enums/index.js";
import { CollectionModeEnum } from "../enums/index.js";

export const ListingSchema = z.object({
  listingId: z.string(),
  listingDomain: ListingDomainEnum,
  title: z.string(),
  description: z.string().nullable(),
  sku: z.string().nullable(),
  url: z.string().nullable(),
  brandName: z.string().nullable(),
  currency: z.string(),
  priceAmount: z.number().nullable(),
  priceType: PriceTypeEnum.nullable(),
  pricingNotes: z.string().nullable(),
  constraints: z.string().nullable(),
  regionsAvailable: z.array(z.string()).nullable(),
  requiresAppointment: z.boolean().nullable(),
  collectionMode: CollectionModeEnum.nullable(),
  turnaroundTime: z.string().nullable(),
});

export type Listing = z.infer<typeof ListingSchema>;
