export const findExistingLabTestIdCypher = `
  // Try to locate an existing lab test by any provided key.
  // Order of precedence: labTestId, name.
  OPTIONAL MATCH (ltById:LabTest {labTestId: $labTestId})
  WITH ltById
  WHERE ltById IS NOT NULL
  RETURN ltById.labTestId AS labTestId
  UNION
  OPTIONAL MATCH (ltByName:LabTest {name: $name})
  WITH ltByName
  WHERE $name IS NOT NULL AND ltByName IS NOT NULL
  RETURN ltByName.labTestId AS labTestId
`;
