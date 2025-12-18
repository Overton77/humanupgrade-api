import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import mongoose from "mongoose";
import { z } from "zod";

import { connectToDatabase } from "../db/connection.js";
import { Business } from "../models/Business.js";
import { Person } from "../models/Person.js";
import { Product } from "../models/Product.js";
import { Compound } from "../models/Compound.js";
import { Episode } from "../models/Episode.js";

/* -------------------------------------------------------------------------- */
/*                                   SETUP                                    */
/* -------------------------------------------------------------------------- */

export const adminSeedRouter = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_IMPORT_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_IMPORT_TOKEN is not set" });
  }

  if (req.header("x-admin-token") !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const ExecSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
});

const CompoundSeedSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});

const ProductSeedSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  sourceUrl: z.string().optional(),
  price: z.number().nonnegative(),

  compounds: z.array(CompoundSeedSchema).optional(),
});

const BusinessSeedSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  biography: z.string().optional(),
  website: z.string().optional(),

  ownerNames: z.array(z.string()).optional(),
  executives: z.array(ExecSchema).optional(),

  products: z.array(ProductSeedSchema).optional(),
});

const EpisodeSeedSchema = z.object({
  episodePageUrl: z.string().min(1),
  publishedSummary: z.string().optional(),
  takeaways: z.array(z.string()).optional(),
  guestNames: z.array(z.string()).optional(),
  sponsorBusinessNames: z.array(z.string()).optional(),
});

const SeedBundleSchema = z.object({
  businesses: z.array(BusinessSeedSchema).optional(),
  episodes: z.array(EpisodeSeedSchema).optional(),
});

const ModeSchema = z.enum(["dry_run", "commit"]).default("dry_run");

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function normalizeName(v: string) {
  return v.trim().replace(/\s+/g, " ");
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values
    .map(normalizeName)
    .filter(
      (v) => v && !seen.has(v.toLowerCase()) && seen.add(v.toLowerCase())
    );
}

function parseSeedBundle(req: Request): unknown {
  if (req.is("application/json")) return req.body;

  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) throw new Error("Missing JSON body or multipart file upload");

  return JSON.parse(file.buffer.toString("utf-8"));
}

/* -------------------------------------------------------------------------- */
/*                                 CONTEXT                                    */
/* -------------------------------------------------------------------------- */

type SeedCtx = {
  businessIdByName: Map<string, mongoose.Types.ObjectId>;
  personIdByName: Map<string, mongoose.Types.ObjectId>;
  productIdByName: Map<string, mongoose.Types.ObjectId>;
  compoundIdByName: Map<string, mongoose.Types.ObjectId>;
};

type SeedReport = {
  mode: "dry_run" | "commit";
  stats: Record<string, { created: number; found: number; updated: number }>;
  errors: Array<{ path: string; message: string }>;
};

function newReport(mode: "dry_run" | "commit"): SeedReport {
  return {
    mode,
    stats: {
      businesses: { created: 0, found: 0, updated: 0 },
      people: { created: 0, found: 0, updated: 0 },
      products: { created: 0, found: 0, updated: 0 },
      compounds: { created: 0, found: 0, updated: 0 },
      episodes: { created: 0, found: 0, updated: 0 },
    },
    errors: [],
  };
}

/* -------------------------------------------------------------------------- */
/*                            FIND OR CREATE HELPERS                           */
/* -------------------------------------------------------------------------- */

async function ensurePerson(
  name: string,
  mode: "dry_run" | "commit",
  ctx: SeedCtx,
  report: SeedReport
) {
  const key = normalizeName(name).toLowerCase();
  if (ctx.personIdByName.has(key)) return ctx.personIdByName.get(key)!;

  const existing = await Person.findOne({ name: normalizeName(name) });
  if (existing) {
    report.stats.people.found++;
    ctx.personIdByName.set(key, existing._id);
    return existing._id;
  }

  report.stats.people.created++;
  if (mode === "dry_run") {
    const fake = new mongoose.Types.ObjectId();
    ctx.personIdByName.set(key, fake);
    return fake;
  }

  const created = await Person.create({ name: normalizeName(name) });
  ctx.personIdByName.set(key, created._id);
  return created._id;
}

async function ensureBusiness(
  b: z.infer<typeof BusinessSeedSchema>,
  mode: "dry_run" | "commit",
  ctx: SeedCtx,
  report: SeedReport
) {
  const key = normalizeName(b.name).toLowerCase();
  if (ctx.businessIdByName.has(key)) return ctx.businessIdByName.get(key)!;

  const existing = await Business.findOne({ name: normalizeName(b.name) });
  if (existing) {
    report.stats.businesses.found++;
    ctx.businessIdByName.set(key, existing._id);

    if (mode === "commit") {
      await Business.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...(b.description && { description: b.description }),
            ...(b.biography && { biography: b.biography }),
            ...(b.website && { website: b.website }),
          },
        }
      );
      report.stats.businesses.updated++;
    }

    return existing._id;
  }

  report.stats.businesses.created++;
  if (mode === "dry_run") {
    const fake = new mongoose.Types.ObjectId();
    ctx.businessIdByName.set(key, fake);
    return fake;
  }

  const created = await Business.create({
    name: normalizeName(b.name),
    description: b.description,
    biography: b.biography,
    website: b.website,
  });

  ctx.businessIdByName.set(key, created._id);
  return created._id;
}

async function ensureCompound(
  c: z.infer<typeof CompoundSeedSchema>,
  mode: "dry_run" | "commit",
  ctx: SeedCtx,
  report: SeedReport
) {
  const key = normalizeName(c.name).toLowerCase();
  if (ctx.compoundIdByName.has(key)) return ctx.compoundIdByName.get(key)!;

  const existing = await Compound.findOne({ name: normalizeName(c.name) });
  if (existing) {
    report.stats.compounds.found++;
    ctx.compoundIdByName.set(key, existing._id);

    if (mode === "commit") {
      await Compound.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...(c.description && { description: c.description }),
            ...(c.aliases?.length && { aliases: uniqueStrings(c.aliases) }),
          },
        }
      );
      report.stats.compounds.updated++;
    }

    return existing._id;
  }

  report.stats.compounds.created++;
  if (mode === "dry_run") {
    const fake = new mongoose.Types.ObjectId();
    ctx.compoundIdByName.set(key, fake);
    return fake;
  }

  const created = await Compound.create({
    name: normalizeName(c.name),
    description: c.description,
    aliases: c.aliases ? uniqueStrings(c.aliases) : undefined,
  });

  ctx.compoundIdByName.set(key, created._id);
  return created._id;
}

async function ensureProduct(
  p: z.infer<typeof ProductSeedSchema>,
  businessId: mongoose.Types.ObjectId,
  mode: "dry_run" | "commit",
  ctx: SeedCtx,
  report: SeedReport
) {
  const key = normalizeName(p.name).toLowerCase();
  if (ctx.productIdByName.has(key)) return ctx.productIdByName.get(key)!;

  const existing = await Product.findOne({ name: normalizeName(p.name) });
  if (existing) {
    report.stats.products.found++;
    ctx.productIdByName.set(key, existing._id);

    if (mode === "commit") {
      await Product.updateOne(
        { _id: existing._id },
        {
          $set: {
            businessId,
            ...(p.description && { description: p.description }),
            ...(p.ingredients && { ingredients: p.ingredients }),
            ...(p.price && { price: p.price }),
          },
        }
      );
      report.stats.products.updated++;
    }

    return existing._id;
  }

  report.stats.products.created++;
  if (mode === "dry_run") {
    const fake = new mongoose.Types.ObjectId();
    ctx.productIdByName.set(key, fake);
    return fake;
  }

  const created = await Product.create({
    name: normalizeName(p.name),
    businessId,
    description: p.description,
    ingredients: p.ingredients,
  });

  ctx.productIdByName.set(key, created._id);
  return created._id;
}

/* -------------------------------------------------------------------------- */
/*                                   ROUTE                                    */
/* -------------------------------------------------------------------------- */

adminSeedRouter.post(
  "/seed",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    await connectToDatabase("humanupgrade");

    const mode = ModeSchema.parse(req.query.mode ?? "dry_run");
    const report = newReport(mode);

    const ctx: SeedCtx = {
      businessIdByName: new Map(),
      personIdByName: new Map(),
      productIdByName: new Map(),
      compoundIdByName: new Map(),
    };

    try {
      const bundle = SeedBundleSchema.parse(parseSeedBundle(req));

      /* ------------------------------ BUSINESSES ------------------------------ */
      for (const b of bundle.businesses ?? []) {
        const businessId = await ensureBusiness(b, mode, ctx, report);

        const ownerIds = await Promise.all(
          uniqueStrings(b.ownerNames ?? []).map((n) =>
            ensurePerson(n, mode, ctx, report)
          )
        );

        const executives = [];
        for (const e of b.executives ?? []) {
          const personId = await ensurePerson(e.name, mode, ctx, report);
          executives.push({ personId, title: e.title, role: e.role });
        }

        if (mode === "commit") {
          await Business.updateOne(
            { _id: businessId },
            {
              $set: {
                ...(ownerIds.length && { ownerIds }),
                ...(executives.length && { executives }),
              },
            }
          );
          await Business.syncPersonLinks(businessId);
        }

        for (const p of b.products ?? []) {
          const compoundIds = [];
          for (const c of p.compounds ?? []) {
            compoundIds.push(await ensureCompound(c, mode, ctx, report));
          }

          const productId = await ensureProduct(
            p,
            businessId,
            mode,
            ctx,
            report
          );

          if (mode === "commit") {
            await Product.updateOne(
              { _id: productId },
              { $set: { compoundIds } }
            );
            await Product.syncProductsForBusiness(businessId);
            for (const cid of compoundIds) {
              await Compound.syncProductsForCompound(cid);
            }
          }
        }
      }

      /* ------------------------------- EPISODES ------------------------------- */
      for (const e of bundle.episodes ?? []) {
        const guestIds = await Promise.all(
          uniqueStrings(e.guestNames ?? []).map((n) =>
            ensurePerson(n, mode, ctx, report)
          )
        );

        const sponsorBusinessIds = await Promise.all(
          uniqueStrings(e.sponsorBusinessNames ?? []).map((n) =>
            ensureBusiness({ name: n }, mode, ctx, report)
          )
        );

        const existing = await Episode.findOne({
          episodePageUrl: e.episodePageUrl,
        });

        if (!existing) {
          report.stats.episodes.created++;
          if (mode === "commit") {
            await Episode.create({
              episodePageUrl: e.episodePageUrl,
              publishedSummary: e.publishedSummary,
              takeaways: e.takeaways,
              guestIds,
              sponsorBusinessIds,
            });
          }
        } else {
          report.stats.episodes.found++;
          if (mode === "commit") {
            await Episode.updateOne(
              { _id: existing._id },
              {
                $set: {
                  ...(e.publishedSummary && {
                    publishedSummary: e.publishedSummary,
                  }),
                  ...(e.takeaways && { takeaways: e.takeaways }),
                  ...(guestIds.length && { guestIds }),
                  ...(sponsorBusinessIds.length && { sponsorBusinessIds }),
                },
              }
            );
            report.stats.episodes.updated++;
            await Episode.syncGuestLinks(existing);
            for (const bid of sponsorBusinessIds) {
              await Business.syncSponsorEpisodesForBusiness(bid);
            }
          }
        }
      }

      return res.json({ ok: report.errors.length === 0, report });
    } catch (err: any) {
      return res.status(400).json({ ok: false, error: err.message, report });
    }
  }
);
