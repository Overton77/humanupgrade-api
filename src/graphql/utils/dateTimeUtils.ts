import { z } from "zod";

// ============================================================================
// Neo4j-safe temporal coercers (NO JS Date objects in output)
// ============================================================================
//
// Neo4j node/rel properties cannot be JS Date objects (driver serializes as Map{}).
// We coerce all temporal inputs to ISO STRINGS (primitive), then you cast in Cypher
// using date(...) or datetime(...).
//

/**
 * Accepts Date | string | number, returns "YYYY-MM-DD" or null.
 * Use this for Neo4j `date(...)` fields.
 */

// DateTime form must be in the format of YYYY-MM-DDTHH:MM:SS.SSSZ
// Javascript method to do so is toISOString()
export const Neo4jDateString = z
  .preprocess((v) => {
    if (v === null || v === undefined || v === "") return null;

    // Already looks like YYYY-MM-DD
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return v;

    // YYYY-MM-DD (UTC)
    return d.toISOString().slice(0, 10);
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .nullable();

/**
 * Accepts Date | string | number, returns ISO datetime string or null.
 * Use this for Neo4j `datetime(...)` fields.
 */
export const Neo4jDateTimeString = z
  .preprocess(
    (v) => {
      if (v === null || v === undefined || v === "") return null;

      // If it's a string and parseable, normalize to ISO
      if (typeof v === "string") {
        // keep already-ISO-ish strings, but normalize if parseable
        const parsed = new Date(v);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
        return v;
      }

      const d = v instanceof Date ? v : new Date(String(v));
      if (Number.isNaN(d.getTime())) return v;

      return d.toISOString();
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
      message: "Must be a valid ISO 8601 datetime string",
    })
  )
  .nullable();
