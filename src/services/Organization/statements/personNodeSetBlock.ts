/**
 * Reusable Person node SET blocks for Cypher.
 * Use in CREATE branch: rel.person.create
 * Use in UPDATE branch: rel.person.update
 */
export const personNodeSetBlockCreate = (prefix: string) => `
  SET p += {
    canonicalName: CASE WHEN ${prefix}.canonicalName IS NULL THEN p.canonicalName ELSE ${prefix}.canonicalName END,
    givenName: CASE WHEN ${prefix}.givenName IS NULL THEN p.givenName ELSE ${prefix}.givenName END,
    familyName: CASE WHEN ${prefix}.familyName IS NULL THEN p.familyName ELSE ${prefix}.familyName END,
    middleName: CASE WHEN ${prefix}.middleName IS NULL THEN p.middleName ELSE ${prefix}.middleName END,
    suffix: CASE WHEN ${prefix}.suffix IS NULL THEN p.suffix ELSE ${prefix}.suffix END,
    honorific: CASE WHEN ${prefix}.honorific IS NULL THEN p.honorific ELSE ${prefix}.honorific END,
    bio: CASE WHEN ${prefix}.bio IS NULL THEN p.bio ELSE ${prefix}.bio END,
    primaryLanguage: CASE WHEN ${prefix}.primaryLanguage IS NULL THEN p.primaryLanguage ELSE ${prefix}.primaryLanguage END,
    primaryDomain: CASE WHEN ${prefix}.primaryDomain IS NULL THEN p.primaryDomain ELSE ${prefix}.primaryDomain END,
    affiliationSummary: CASE WHEN ${prefix}.affiliationSummary IS NULL THEN p.affiliationSummary ELSE ${prefix}.affiliationSummary END,
    orcid: CASE WHEN ${prefix}.orcid IS NULL THEN p.orcid ELSE ${prefix}.orcid END,
    npi: CASE WHEN ${prefix}.npi IS NULL THEN p.npi ELSE ${prefix}.npi END,
    websiteUrl: CASE WHEN ${prefix}.websiteUrl IS NULL THEN p.websiteUrl ELSE ${prefix}.websiteUrl END,
    email: CASE WHEN ${prefix}.email IS NULL THEN p.email ELSE ${prefix}.email END,
    linkedinUrl: CASE WHEN ${prefix}.linkedinUrl IS NULL THEN p.linkedinUrl ELSE ${prefix}.linkedinUrl END,
    twitterUrl: CASE WHEN ${prefix}.twitterUrl IS NULL THEN p.twitterUrl ELSE ${prefix}.twitterUrl END,
    githubUrl: CASE WHEN ${prefix}.githubUrl IS NULL THEN p.githubUrl ELSE ${prefix}.githubUrl END,
    scholarUrl: CASE WHEN ${prefix}.scholarUrl IS NULL THEN p.scholarUrl ELSE ${prefix}.scholarUrl END,
    headshotUrl: CASE WHEN ${prefix}.headshotUrl IS NULL THEN p.headshotUrl ELSE ${prefix}.headshotUrl END,
    publicFigure: CASE WHEN ${prefix}.publicFigure IS NULL THEN p.publicFigure ELSE ${prefix}.publicFigure END,
    notabilityNotes: CASE WHEN ${prefix}.notabilityNotes IS NULL THEN p.notabilityNotes ELSE ${prefix}.notabilityNotes END,
    validAt: CASE WHEN ${prefix}.validAt IS NULL THEN p.validAt ELSE ${prefix}.validAt END,
    invalidAt: CASE WHEN ${prefix}.invalidAt IS NULL THEN p.invalidAt ELSE ${prefix}.invalidAt END,
    expiredAt: CASE WHEN ${prefix}.expiredAt IS NULL THEN p.expiredAt ELSE ${prefix}.expiredAt END,
    searchText: CASE WHEN ${prefix}.searchText IS NULL THEN p.searchText ELSE ${prefix}.searchText END
  }
  SET p.aliases = apoc.coll.toSet(coalesce(p.aliases, []) + coalesce(${prefix}.aliases, []))
  SET p.specialties = apoc.coll.toSet(coalesce(p.specialties, []) + coalesce(${prefix}.specialties, []))
  SET p.expertiseTags = apoc.coll.toSet(coalesce(p.expertiseTags, []) + coalesce(${prefix}.expertiseTags, []))
  SET p.degrees = apoc.coll.toSet(coalesce(p.degrees, []) + coalesce(${prefix}.degrees, []))
  SET p.credentialIds = apoc.coll.toSet(coalesce(p.credentialIds, []) + coalesce(${prefix}.credentialIds, []))
  SET p.licenseIds = apoc.coll.toSet(coalesce(p.licenseIds, []) + coalesce(${prefix}.licenseIds, []))
  SET p.socialProfiles = apoc.coll.toSet(coalesce(p.socialProfiles, []) + coalesce(${prefix}.socialProfiles, []))
`;
