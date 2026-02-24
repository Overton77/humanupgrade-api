import {
  executeWrite,
  executeRead,
} from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";

import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  OrganizationInput,
  OrganizationInputSchema,
  UpdateOrganizationInput,
  UpdateOrganizationInputSchema,
} from "../../graphql/inputs/OrganizationInputs.js";
import { Organization } from "../../graphql/types/OrganizationModel.js";
import {
  createOrganizationStatements,
  updateOrganizationStatements,
} from "./statements/index.js";  
import { resolveOrgIdentifier } from "./utils/resolveOrgIdentity.js";





export async function updateOrganizationWithOptionalRelations(
  input: UpdateOrganizationInput
): Promise<Organization> {
  const validated: UpdateOrganizationInput = validateInput(
    UpdateOrganizationInputSchema,
    input,
    "UpdateOrganizationInputWithOptionalRelations"
  );

  // Keep params as primitives/arrays; each tx.run block plucks what it needs.
  const params: UpdateOrganizationInput = {
    organizationId: validated.organizationId ?? null, 

    // node fields
    name: validated.name ?? null,
    aliases: validated.aliases ?? null,
    orgType: validated.orgType ?? null,
    description: validated.description ?? null,
    businessModel: validated.businessModel ?? null,
    primaryIndustryTags: validated.primaryIndustryTags ?? null,
    regionsServed: validated.regionsServed ?? null,
    legalName: validated.legalName ?? null,
    legalStructure: validated.legalStructure ?? null,
    ownershipType: validated.ownershipType ?? null,
    jurisdictionsOfIncorporation:
      validated.jurisdictionsOfIncorporation ?? null,
    websiteUrl: validated.websiteUrl ?? null,
    defaultCollectionModes: validated.defaultCollectionModes ?? null,
    defaultRegionsAvailable: validated.defaultRegionsAvailable ?? null,
    publicTicker: validated.publicTicker ?? null,
    fundingStage: validated.fundingStage ?? null,
    employeeCountMin: validated.employeeCountMin ?? null,
    employeeCountMax: validated.employeeCountMax ?? null,
    employeeCountAsOf: validated.employeeCountAsOf ?? null,
    revenueAnnualMin: validated.revenueAnnualMin ?? null,
    revenueAnnualMax: validated.revenueAnnualMax ?? null,
    revenueAnnualCurrency: validated.revenueAnnualCurrency ?? null,
    revenueAnnualAsOf: validated.revenueAnnualAsOf ?? null,
    valuationMin: validated.valuationMin ?? null,
    valuationMax: validated.valuationMax ?? null,
    valuationCurrency: validated.valuationCurrency ?? null,
    valuationAsOf: validated.valuationAsOf ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // relation arrays (we only run a block if array.length)
    hasLocation: validated.hasLocation ?? [],
    ownsOrControls: validated.ownsOrControls ?? [],
    lists: validated.lists ?? [],
    offersProduct: validated.offersProduct ?? [],
    suppliesCompoundForm: validated.suppliesCompoundForm ?? [],
    manufactures: validated.manufactures ?? [],
    manufacturesProduct: validated.manufacturesProduct ?? [],
    contractManufacturerForOrganization:
      validated.contractManufacturerForOrganization ?? [],
    contractManufacturerForProduct:
      validated.contractManufacturerForProduct ?? [],
    contractManufacturerForCompoundForm:
      validated.contractManufacturerForCompoundForm ?? [],
    performsManufacturingProcess: validated.performsManufacturingProcess ?? [],
    developsPlatform: validated.developsPlatform ?? [],
    usesPlatform: validated.usesPlatform ?? [],
    employs: validated.employs ?? [],
    foundedBy: validated.foundedBy ?? [],
    hasBoardMember: validated.hasBoardMember ?? [],
    hasScientificAdvisor: validated.hasScientificAdvisor ?? [],
    hasExecutiveRole: validated.hasExecutiveRole ?? [],
  }; 

  const {key, value} = resolveOrgIdentifier(params);   
  const updateCypher = updateOrganizationStatements.buildOrgUpdateCypher(key);  



  try {
    const organization = await executeWrite(async (tx) => {
      // ------------------------------------------------------------
      // 0) Ensure org exists + update its scalar fields
      // ------------------------------------------------------------ 

      let org: Organization | null; 
      {
        const res = await tx.run(
          updateCypher,
          {...params, idValue: value}
        );

        const record = firstRecordOrNull(res);
        if (!record) throw new Error("updateOrganization: no record returned");  

        const orgRecord = record.get("o");  

        if (!orgRecord) throw Errors.internalError("Organization not found");    

        org = orgRecord; 


      }    

      const finalOrgId: string | null = org?.properties?.organizationId ?? org?.organizationId;    

      if (!finalOrgId)
        throw Errors.internalError("Organization ID is required");   

      const nextParams: UpdateOrganizationInput = {...params, organizationId: finalOrgId};

       



      // ------------------------------------------------------------
      // 1) HAS_LOCATION (create / connect / update) — strict semantics
      // ------------------------------------------------------------
      if (params.hasLocation.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationHasLocationCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 2) OWNS_OR_CONTROLS (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.ownsOrControls.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationOwnsOrControlsCypher,
          nextParams
        );
      }

      if (params.lists.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationListsCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 4) OFFERS_PRODUCT (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.offersProduct.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationOffersProductCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 5) SUPPLIES_COMPOUND_FORM (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.suppliesCompoundForm.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationSuppliesCompoundFormCypher,
         nextParams
        );
      }

      // ------------------------------------------------------------
      // 6) MANUFACTURES (create / connect / update strict)
      // NOTE: update must NOT create missing relationship.
      // ------------------------------------------------------------
      if (params.manufactures.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationManufacturesCompoundFormCypher,

          nextParams
        );
      }

      // ------------------------------------------------------------
      // 7) MANUFACTURES_PRODUCT (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.manufacturesProduct.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationManufacturesProductCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 8) CONTRACT_MANUFACTURER_FOR_ORGANIZATION (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.contractManufacturerForOrganization.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationContractManufacturerForOrganizationCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 9) CONTRACT_MANUFACTURER_FOR_PRODUCT (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.contractManufacturerForProduct.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationContractManufacturerForProductCypher,
         nextParams
        );
      }

      // ------------------------------------------------------------
      // 10) CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.contractManufacturerForCompoundForm.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationContractManufacturerForCompoundFormCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 11) PERFORMS_MANUFACTURING_PROCESS (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.performsManufacturingProcess.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationPerformsManufacturingProcessCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 12) DEVELOPS_PLATFORM (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.developsPlatform.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationDevelopsPlatformCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 13) USES_PLATFORM (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.usesPlatform.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationUsesPlatformCypher,
          nextParams
        );
      }
      if (params.employs.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationEmploysCypher,
          nextParams
        );
      }
      if (params.foundedBy.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationFoundedByCypher,
          nextParams
        );
      }
      if (params.hasBoardMember.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationHasBoardMemberCypher,
          nextParams
        );
      }
      if (params.hasScientificAdvisor.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationHasScientificAdvisorCypher,
          nextParams
        );
      }
      if (params.hasExecutiveRole.length) {
        await tx.run(
          updateOrganizationStatements.updateOrganizationHasExecutiveRoleCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 14) Return updated org
      // ------------------------------------------------------------
      const final = await tx.run(
        updateOrganizationStatements.returnUpdatedOrganizationCypher,
        { organizationId: finalOrgId }
      );

      const record = firstRecordOrNull(final);
      if (!record) throw new Error("updateOrganization: no record returned");
      const node = record.get("o");
      return node?.properties ?? node;
    });

    return organization as Organization;
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

export async function createOrganizationWithOptionalRelations(
  input: OrganizationInput
): Promise<Organization> {
  const validated = validateInput(
    OrganizationInputSchema,
    input,
    "OrganizationInputWithOptionalRelations"
  );

  // IMPORTANT:
  // - For relationship arrays, prefer [] (not null) so UNWIND is predictable.
  // - For scalar/primitive arrays (aliases, tags), your existing null/merge behavior is fine.
  const params = {
    organizationId: validated.organizationId ?? null, 
    name: validated.name ?? null,
    aliases: validated.aliases ?? null,
    orgType: validated.orgType,
    description: validated.description ?? null,
    businessModel: validated.businessModel ?? null,
    primaryIndustryTags: validated.primaryIndustryTags ?? null,
    regionsServed: validated.regionsServed ?? null,
    legalName: validated.legalName ?? null,
    legalStructure: validated.legalStructure ?? null,
    ownershipType: validated.ownershipType ?? null,
    jurisdictionsOfIncorporation:
      validated.jurisdictionsOfIncorporation ?? null,
    websiteUrl: validated.websiteUrl ?? null,
    defaultCollectionModes: validated.defaultCollectionModes ?? null,
    defaultRegionsAvailable: validated.defaultRegionsAvailable ?? null,
    publicTicker: validated.publicTicker ?? null,
    fundingStage: validated.fundingStage ?? null,
    employeeCountMin: validated.employeeCountMin ?? null,
    employeeCountMax: validated.employeeCountMax ?? null,
    employeeCountAsOf: validated.employeeCountAsOf ?? null,
    revenueAnnualMin: validated.revenueAnnualMin ?? null,
    revenueAnnualMax: validated.revenueAnnualMax ?? null,
    revenueAnnualCurrency: validated.revenueAnnualCurrency ?? null,
    revenueAnnualAsOf: validated.revenueAnnualAsOf ?? null,
    valuationMin: validated.valuationMin ?? null,
    valuationMax: validated.valuationMax ?? null,
    valuationCurrency: validated.valuationCurrency ?? null,
    valuationAsOf: validated.valuationAsOf ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    hasLocation: validated.hasLocation ?? [],
    ownsOrControls: validated.ownsOrControls ?? [],
    lists: validated.lists ?? [],
    offersProduct: validated.offersProduct ?? [],
    suppliesCompoundForm: validated.suppliesCompoundForm ?? [],

    manufactures: validated.manufactures ?? [],
    manufacturesProduct: validated.manufacturesProduct ?? [],
    contractManufacturerForOrganization:
      validated.contractManufacturerForOrganization ?? [],
    contractManufacturerForProduct:
      validated.contractManufacturerForProduct ?? [],
    contractManufacturerForCompoundForm:
      validated.contractManufacturerForCompoundForm ?? [],
    performsManufacturingProcess: validated.performsManufacturingProcess ?? [],
    developsPlatform: validated.developsPlatform ?? [],
    usesPlatform: validated.usesPlatform ?? [],
    employs: validated.employs ?? [],
    foundedBy: validated.foundedBy ?? [],
    hasBoardMember: validated.hasBoardMember ?? [],
    hasScientificAdvisor: validated.hasScientificAdvisor ?? [],
    hasExecutiveRole: validated.hasExecutiveRole ?? [],
  };

  const {
    buildOrgUpsertCypher,
    organizationHasLocationCypher,
    organizationOwnsOrControlsCypher,
    organizationListsCypher,
    organizationOffersProductCypher,
    organizationSuppliesCompoundFormCypher,
    organizationManufacturesCompoundFormCypher,
    organizationManufacturesProductCypher,
    organizationContractManufacturerForOrganizationCypher,
    organizationContractManufacturerForProductCypher,
    organizationContractManufacturerForCompoundFormCypher,
    organizationPerformsManufacturingProcessCypher,
    organizationDevelopsPlatformCypher,
    organizationUsesPlatformCypher,
    organizationEmploysCypher,
    organizationFoundedByCypher,
    organizationHasBoardMemberCypher,
    organizationHasScientificAdvisorCypher,
    organizationHasExecutiveRoleCypher,
    returnOrganizationsCypher,
  } = createOrganizationStatements; 

  const {key, value} = resolveOrgIdentifier(params);  

  const upsertCypher = buildOrgUpsertCypher(key); 

  try {
    const organization = await executeWrite(async (tx) => {
      // 1) Upsert org
      const upsertRes = await tx.run(upsertCypher, {...params, idValue: value});
      const upsertRecord = firstRecordOrNull(upsertRes);
      if (!upsertRecord)
        throw new Error("createOrganization: no record returned from upsert"); 

      const org = upsertRecord.get("o"); 

      const resolvedOrgId = org?.properties?.organizationId ?? org?.organizationId;   
  

      if (!resolvedOrgId)
        throw Errors.internalError("Organization ID is required");  

      const nextParams = {...params, organizationId: resolvedOrgId};

      

      // 2) Relationship statements (each its own Cypher statement, still same TX)
      if (params.hasLocation.length) {
        await tx.run(organizationHasLocationCypher, nextParams);
      }
      if (params.ownsOrControls.length) {
        await tx.run(organizationOwnsOrControlsCypher, nextParams);
      }
      if (params.lists.length) {
        await tx.run(organizationListsCypher, nextParams);
      }
      if (params.offersProduct.length) {
        await tx.run(organizationOffersProductCypher, nextParams);
      }
      if (params.suppliesCompoundForm.length) {
        await tx.run(organizationSuppliesCompoundFormCypher, nextParams);
      }
      if (params.manufactures.length) {
        await tx.run(organizationManufacturesCompoundFormCypher, nextParams);
      }
      if (params.manufacturesProduct.length) {
        await tx.run(organizationManufacturesProductCypher, nextParams);
      }
      if (params.contractManufacturerForOrganization.length) {
        await tx.run(
          organizationContractManufacturerForOrganizationCypher,
          nextParams
        );
      }
      if (params.contractManufacturerForProduct.length) {
        await tx.run(organizationContractManufacturerForProductCypher, nextParams);
      }
      if (params.contractManufacturerForCompoundForm.length) {
        await tx.run(
          organizationContractManufacturerForCompoundFormCypher,
          nextParams
        );
      }
      if (params.performsManufacturingProcess.length) {
        await tx.run(organizationPerformsManufacturingProcessCypher, nextParams);
      }
      if (params.developsPlatform.length) {
        await tx.run(organizationDevelopsPlatformCypher, nextParams);
      }
      if (params.usesPlatform.length) {
        await tx.run(organizationUsesPlatformCypher, nextParams);
      }
      if (params.employs.length) {
        await tx.run(organizationEmploysCypher, nextParams);
      }
      if (params.foundedBy.length) {
        await tx.run(organizationFoundedByCypher, nextParams);
      }
      if (params.hasBoardMember.length) {
        await tx.run(organizationHasBoardMemberCypher, nextParams);
      }
      if (params.hasScientificAdvisor.length) {
        await tx.run(organizationHasScientificAdvisorCypher, nextParams);
      }
      if (params.hasExecutiveRole.length) {
        await tx.run(organizationHasExecutiveRoleCypher, nextParams);
      }

      // 3) Return org at end
      const finalRes = await tx.run(returnOrganizationsCypher, nextParams);
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("createOrganization: org not found after writes");

      const node = finalRecord.get("o");
      return node?.properties ?? node;
    });

    return organization as Organization;
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

export async function findAllOrganizations(): Promise<Organization[]> {
  try {
    const organizations = await executeRead(async (tx) => {
      const result = await tx.run(
        `
          MATCH (o:Organization)
          RETURN properties(o) AS organization
          ORDER BY o.createdAt DESC
        `
      );

      return result.records.map((r: Record<string, any>) =>
        r.get("organization")
      );
    });

    return organizations as Organization[];
  } catch (err) {
    logger.error(`findAllOrganizations failed: ${err}`);
    throw Errors.internalError("Failed to fetch organizations");
  }
}
