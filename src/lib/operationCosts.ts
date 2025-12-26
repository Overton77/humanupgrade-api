export const COST_BY_OPERATION: Record<string, number> = {
  // ---------- Auth ----------
  register: 5,
  login: 4,

  // ---------- User / Profile ----------
  me: 1,
  myProfile: 2,
  allUsers: 3,

  upsertUser: 6,
  deleteUser: 10,
  upsertUserProfile: 5,
  deleteUserProfile: 6,

  // ---------- Core list queries (paginated) ----------
  episodes: 2,
  products: 2,
  compounds: 2,
  protocols: 2,
  people: 2,
  businesses: 2,
  caseStudies: 2,

  // ---------- Single-document reads ----------
  episode: 1, // ✅ add
  product: 1,
  compound: 1,
  person: 1,
  business: 1,
  caseStudy: 1,
  protocol: 1,

  // ---------- Vector search (expensive) ----------
  vectorSearchProducts: 15,
  vectorSearchBusinesses: 15,
  vectorSearchPeople: 15,

  // ---------- Business mutations ----------
  createBusinessWithRelations: 14,
  updateBusiness: 8,
  updateBusinessRelations: 10,
  deleteBusiness: 12,

  // ---------- Product mutations ----------
  createProduct: 12,
  updateProduct: 8,
  updateProductRelations: 10,
  deleteProduct: 10,

  // ---------- Person mutations ----------
  createPerson: 10,
  updatePerson: 7,
  deletePerson: 9,

  // ---------- Episode mutations ----------
  createEpisode: 12,
  updateEpisode: 8,
  updateEpisodeRelations: 10,
  deleteEpisode: 12,
  deleteAllEpisodes: 100,

  // ---------- Compound mutations ----------
  createCompound: 10,
  updateCompound: 7,
  updateCompoundRelations: 9,
  deleteCompound: 9,

  // ---------- CaseStudy mutations ----------
  createCaseStudy: 10,
  updateCaseStudy: 7,

  // ---------- Protocol mutations ----------
  createProtocol: 12,
  updateProtocol: 8,
  updateProtocolRelations: 10,
  deleteProtocol: 10, // ✅ add (similar to deleteProduct)

  // ---------- Embedding / heavy compute ----------
  embedProductDescription: 50,
  embedBusinessDescription: 50,
  embedPersonBio: 50,

  // ---------- UserSaved ----------
  savedEntities: 4,
  saveEntity: 4,
  unsaveEntity: 4,

  // ---------- UserProtocols ----------
  myUserProtocols: 5,
  createUserProtocol: 6,
  updateUserProtocol: 6,
  deleteUserProtocol: 6,
};
export const DEFAULT_OPERATION_COST = 2;

export function getOperationCost(opName?: string | null) {
  if (!opName) return DEFAULT_OPERATION_COST;
  return COST_BY_OPERATION[opName] ?? DEFAULT_OPERATION_COST;
}
