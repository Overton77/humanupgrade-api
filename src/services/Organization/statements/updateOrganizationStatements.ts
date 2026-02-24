import { OrgIdentifierKey } from "../types.js";

export function buildOrgUpdateCypher(identifierKey: OrgIdentifierKey) {
  return `  

  OPTIONAL MATCH (o:Organization { ${identifierKey}: $idValue })
  CALL apoc.util.validate(
    o IS NULL,
    'updateOrganization failed: Organization not found for ${identifierKey} %s',
    [$idValue]
  ) 

  SET o.organizationId = coalesce(o.organizationId, randomUUID()) 
  SET o += {
    name: CASE WHEN $name IS NULL THEN o.name ELSE $name END,
  
    aliases: CASE
      WHEN $aliases IS NULL THEN o.aliases
      ELSE apoc.coll.toSet(coalesce(o.aliases, []) + coalesce($aliases, []))
    END,
  
    orgType: CASE WHEN $orgType IS NULL THEN o.orgType ELSE $orgType END,
    description: CASE WHEN $description IS NULL THEN o.description ELSE $description END,
    businessModel: CASE WHEN $businessModel IS NULL THEN o.businessModel ELSE $businessModel END,
  
    primaryIndustryTags: CASE
      WHEN $primaryIndustryTags IS NULL THEN o.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(o.primaryIndustryTags, []) + coalesce($primaryIndustryTags, []))
    END,
  
    regionsServed: CASE
      WHEN $regionsServed IS NULL THEN o.regionsServed
      ELSE apoc.coll.toSet(coalesce(o.regionsServed, []) + coalesce($regionsServed, []))
    END,
  
    legalName: CASE WHEN $legalName IS NULL THEN o.legalName ELSE $legalName END,
    legalStructure: CASE WHEN $legalStructure IS NULL THEN o.legalStructure ELSE $legalStructure END,
    ownershipType: CASE WHEN $ownershipType IS NULL THEN o.ownershipType ELSE $ownershipType END,
  
    jurisdictionsOfIncorporation: CASE
      WHEN $jurisdictionsOfIncorporation IS NULL THEN o.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(o.jurisdictionsOfIncorporation, []) + coalesce($jurisdictionsOfIncorporation, []))
    END,
  
    websiteUrl: CASE WHEN $websiteUrl IS NULL THEN o.websiteUrl ELSE $websiteUrl END,
  
    defaultCollectionModes: CASE
      WHEN $defaultCollectionModes IS NULL THEN o.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(o.defaultCollectionModes, []) + coalesce($defaultCollectionModes, []))
    END,
  
    defaultRegionsAvailable: CASE
      WHEN $defaultRegionsAvailable IS NULL THEN o.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(o.defaultRegionsAvailable, []) + coalesce($defaultRegionsAvailable, []))
    END,
  
    publicTicker: CASE WHEN $publicTicker IS NULL THEN o.publicTicker ELSE $publicTicker END,
    fundingStage: CASE WHEN $fundingStage IS NULL THEN o.fundingStage ELSE $fundingStage END,
  
    employeeCountMin: CASE WHEN $employeeCountMin IS NULL THEN o.employeeCountMin ELSE $employeeCountMin END,
    employeeCountMax: CASE WHEN $employeeCountMax IS NULL THEN o.employeeCountMax ELSE $employeeCountMax END,
    employeeCountAsOf: CASE WHEN $employeeCountAsOf IS NULL THEN o.employeeCountAsOf ELSE $employeeCountAsOf END,
  
    revenueAnnualMin: CASE WHEN $revenueAnnualMin IS NULL THEN o.revenueAnnualMin ELSE $revenueAnnualMin END,
    revenueAnnualMax: CASE WHEN $revenueAnnualMax IS NULL THEN o.revenueAnnualMax ELSE $revenueAnnualMax END,
    revenueAnnualCurrency: CASE WHEN $revenueAnnualCurrency IS NULL THEN o.revenueAnnualCurrency ELSE $revenueAnnualCurrency END,
    revenueAnnualAsOf: CASE WHEN $revenueAnnualAsOf IS NULL THEN o.revenueAnnualAsOf ELSE $revenueAnnualAsOf END,
  
    valuationMin: CASE WHEN $valuationMin IS NULL THEN o.valuationMin ELSE $valuationMin END,
    valuationMax: CASE WHEN $valuationMax IS NULL THEN o.valuationMax ELSE $valuationMax END,
    valuationCurrency: CASE WHEN $valuationCurrency IS NULL THEN o.valuationCurrency ELSE $valuationCurrency END,
    valuationAsOf: CASE WHEN $valuationAsOf IS NULL THEN o.valuationAsOf ELSE $valuationAsOf END,
  
    validAt: CASE WHEN $validAt IS NULL THEN o.validAt ELSE $validAt END,
    invalidAt: CASE WHEN $invalidAt IS NULL THEN o.invalidAt ELSE $invalidAt END,
    expiredAt: CASE WHEN $expiredAt IS NULL THEN o.expiredAt ELSE $expiredAt END
  }
  RETURN o
  
  
  `;
}

export const returnUpdatedOrganizationCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  RETURN o
          `;
