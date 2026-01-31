/**
 * Generic function to map query results to DataLoader keys.
 * Works with any entity type by extracting the ID from the row object.
 *
 * @param keys - Array of entity IDs to map results for
 * @param rows - Query results with an ID field and edges array
 * @param idKey - The key name to extract the ID from (e.g., 'organizationId', 'productId')
 * @returns Array of edge arrays, one per key in the same order
 */
export function mapResultsToKeys<T, TIdKey extends string>(
  keys: readonly string[],
  rows: Array<Record<TIdKey, string> & { edges: T[] }>,
  idKey: TIdKey
): T[][] {
  const byId = new Map<string, T[]>();
  for (const row of rows) {
    const id = row[idKey];
    if (id) {
      byId.set(id, row.edges ?? []);
    }
  }
  return keys.map((k) => byId.get(k) ?? []);
}

/**
 * Convenience function for Organization entity loaders.
 */
export function mapOrganizationResultsToKeys<T>(
  keys: readonly string[],
  rows: Array<{ organizationId: string; edges: T[] }>
): T[][] {
  return mapResultsToKeys(keys, rows, "organizationId");
}

/**
 * Convenience function for Product entity loaders.
 */
export function mapProductResultsToKeys<T>(
  keys: readonly string[],
  rows: Array<{ productId: string; edges: T[] }>
): T[][] {
  return mapResultsToKeys(keys, rows, "productId");
}
