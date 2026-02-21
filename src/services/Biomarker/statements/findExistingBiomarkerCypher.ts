export const findExistingBiomarkerIdCypher = `
  // Try to locate an existing biomarker by any provided key.
  // Order of precedence: biomarkerId, name.
  OPTIONAL MATCH (bmById:Biomarker {biomarkerId: $biomarkerId})
  WITH bmById
  WHERE bmById IS NOT NULL
  RETURN bmById.biomarkerId AS biomarkerId
  UNION
  OPTIONAL MATCH (bmByName:Biomarker {name: $name})
  WITH bmByName
  WHERE $name IS NOT NULL AND bmByName IS NOT NULL
  RETURN bmByName.biomarkerId AS biomarkerId
`;
