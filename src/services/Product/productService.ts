import {
  executeWrite,
  executeRead,
} from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  ProductInput,
  ProductInputSchema,
  UpdateProductInput,
  UpdateProductInputSchema,
} from "../../graphql/inputs/ProductInputs.js";
import { Product } from "../../graphql/types/ProductModel.js";
import { createProductStatements } from "./statements/createProductStatements.js"; 
import { findExistingProductIdCypher } from "./statements/findExistingProductCypher.js";

import { buildProductUpsertCypher } from "./statements/createProductStatements.js";
import { computeProductFingerprint, resolveProductIdentifier } from "./utils/resolveProductIdentity.js";
import { Errors } from "../../lib/errors.js";
import { buildProductUpdateCypher, updateProductStatements } from "./statements/updateProductStatements.js";

export async function createProductWithOptionalRelations(
  input: ProductInput
): Promise<Product> {
  const validated = validateInput(
    ProductInputSchema,
    input,
    "ProductInputWithOptionalRelations"
  );

  // IMPORTANT:
  // - For relationship arrays, prefer [] (not null) so UNWIND is predictable.
  // - For scalar/primitive arrays (synonyms), your existing null/merge behavior is fine.
  const params = {
    productId: validated.productId ?? null,
    name: validated.name,
    synonyms: validated.synonyms ?? null,
    productDomain: validated.productDomain,
    productType: validated.productType ?? null,
    intendedUse: validated.intendedUse ?? null,
    description: validated.description ?? null, 
    productFingerprint: computeProductFingerprint( 
        { 
            brandName: validated.brandName ?? null, 
            name: validated.name, 
        }
    ), 
    brandName: validated.brandName ?? null,
    modelNumber: validated.modelNumber ?? null,
    ndcCode: validated.ndcCode ?? null,
    upc: validated.upc ?? null,
    gtin: validated.gtin ?? null,
    riskClass: validated.riskClass ?? null,
    currency: validated.currency ?? null,
    priceAmount: validated.priceAmount ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    deliversLabTest: validated.deliversLabTest ?? [],
    implementsPanel: validated.implementsPanel ?? [],
    containsCompoundForm: validated.containsCompoundForm ?? [],
    followsPathway: validated.followsPathway ?? [],
  };

  const {
    productDeliversLabTestCypher,
    productImplementsPanelCypher,
    productContainsCompoundFormCypher,
    productFollowsPathwayCypher,
    returnProductsCypher,
  } = createProductStatements;

  try {
    const product = await executeWrite(async (tx) => { 

      const pre = await tx.run(findExistingProductIdCypher, params); 
      const foundIds = Array.from( 
        new Set(pre.records.map((r) => r.get("productId")).filter(Boolean))
      )
      // 1) Upsert product  

      let writeRes;  

      if (foundIds.length > 1) { 
        throw Errors.duplicate("Product", foundIds.join(", "));
      }  

      if (foundIds.length === 1) {
        const existingProductId = foundIds[0] as string;
        const updateCypher = buildProductUpdateCypher("productId");
        writeRes = await tx.run(updateCypher, { ...params, idValue: existingProductId });
      } else {
        const { key, value } = resolveProductIdentifier(params);
        const upsertCypher = buildProductUpsertCypher(key);
        writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      }



 
     
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("createProduct: no record returned from upsert");

      
      const productNode = upsertRecord.get("p");
      const resolvedProductId = productNode?.properties?.productId ?? productNode?.productId;  

      if (!resolvedProductId) throw Errors.internalError("Write did not produce ProductID. Error")
      
      // Update params with actual productId for relationship statements
      const nextParams = {...params, productId: resolvedProductId}

      // 2) Relationship statements (each its own Cypher statement, still same TX)
      if (nextParams.deliversLabTest.length) {
        await tx.run(productDeliversLabTestCypher, nextParams);
      }
      if (nextParams.implementsPanel.length) {
        await tx.run(productImplementsPanelCypher, nextParams);
      }
      if (nextParams.containsCompoundForm.length) {
        await tx.run(productContainsCompoundFormCypher, nextParams);
      }
      if (nextParams.followsPathway.length) {
        await tx.run(productFollowsPathwayCypher, nextParams);
      }

      // 3) Return product at end
      const finalRes = await tx.run(returnProductsCypher, { productId: resolvedProductId });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("createProduct: product not found after writes");

      const node = finalRecord.get("p");
      return node?.properties ?? node;
    });

    return product as Product;
  } catch (err: any) {
    logger.error("Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

export async function updateProductWithOptionalRelations(
  input: UpdateProductInput
): Promise<Product> {
  const validated = validateInput(
    UpdateProductInputSchema,
    input,
    "UpdateProductInputWithOptionalRelations"
  );

  // Keep params as primitives/arrays; each tx.run block plucks what it needs.
  const params = {
    productId: validated.productId ?? null,
    name: validated.name ?? null,
    synonyms: validated.synonyms ?? null,
    productDomain: validated.productDomain ?? null,
    productType: validated.productType ?? null,
    productFingerprint: validated.productFingerprint ?? null,
    intendedUse: validated.intendedUse ?? null,
    description: validated.description ?? null,
    brandName: validated.brandName ?? null,
    modelNumber: validated.modelNumber ?? null,
    ndcCode: validated.ndcCode ?? null,
    upc: validated.upc ?? null,
    gtin: validated.gtin ?? null,
    riskClass: validated.riskClass ?? null,
    currency: validated.currency ?? null,
    priceAmount: validated.priceAmount ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    deliversLabTest: validated.deliversLabTest ?? [],
    implementsPanel: validated.implementsPanel ?? [],
    containsCompoundForm: validated.containsCompoundForm ?? [],
    followsPathway: validated.followsPathway ?? [],
  };

  // Resolve identifier for update
  const { key, value } = resolveProductIdentifier(params);
  const updateCypher = buildProductUpdateCypher(key);

  try {
    const product = await executeWrite(async (tx) => {
      // ------------------------------------------------------------
      // 0) Ensure product exists + update its scalar fields
      // ------------------------------------------------------------
      let productNode: Product | null;
      {
        const res = await tx.run(updateCypher, { ...params, idValue: value });

        const record = firstRecordOrNull(res);
        if (!record) throw new Error("updateProduct: no record returned");

        const prodRecord = record.get("p");

        if (!prodRecord) throw Errors.internalError("Product not found");

        productNode = prodRecord;
      }

      const finalProductId: string | null =
        (productNode as any)?.properties?.productId ?? (productNode as any)?.productId;

      if (!finalProductId)
        throw Errors.internalError("Product ID is required");

      const nextParams = {
        ...params,
        productId: finalProductId,
      };

      // ------------------------------------------------------------
      // 1) DELIVERS_LAB_TEST (create / connect / update)
      // ------------------------------------------------------------
      if (params.deliversLabTest.length) {
        await tx.run(
          updateProductStatements.updateProductDeliversLabTestCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 2) IMPLEMENTS_PANEL (create / connect / update)
      // ------------------------------------------------------------
      if (params.implementsPanel.length) {
        await tx.run(
          updateProductStatements.updateProductImplementsPanelCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 3) CONTAINS_COMPOUND_FORM (create / connect / update)
      // ------------------------------------------------------------
      if (params.containsCompoundForm.length) {
        await tx.run(
          updateProductStatements.updateProductContainsCompoundFormCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 4) FOLLOWS_PATHWAY (create / connect / update)
      // ------------------------------------------------------------
      if (params.followsPathway.length) {
        await tx.run(
          updateProductStatements.updateProductFollowsPathwayCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 5) Return updated product
      // ------------------------------------------------------------
      const final = await tx.run(
        updateProductStatements.returnUpdatedProductCypher,
        { productId: finalProductId }
      );

      const record = firstRecordOrNull(final);
      if (!record) throw new Error("updateProduct: product not found after writes");
      const node = record.get("p");
      return node?.properties ?? node;
    });

    return product as Product;
  } catch (err: any) {
    logger.error("Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}


export async function findAllProducts(): Promise<Product[]> { 

     try {  

      const products = await executeRead(async (tx) => {
        const result = await tx.run(
          `
            MATCH (p:Product)
            RETURN properties(p) AS product
            ORDER BY p.createdAt DESC
          `
        );

        return result.records.map((record: Record<string, any>) =>
          record.get("product")
        );
      });

      return products as Product[];

     } catch (err) { 
      throw Errors.internalError("Internal Error. Try again later", err)
     }

}