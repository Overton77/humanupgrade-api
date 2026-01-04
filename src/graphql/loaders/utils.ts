export function mapResultsToKeys<T>(
  keys: readonly string[],
  rows: Array<{ organizationId: string; edges: T[] }>
): T[][] {
  const byId = new Map<string, T[]>();
  for (const row of rows) byId.set(row.organizationId, row.edges ?? []);
  return keys.map((k) => byId.get(k) ?? []);
}
