# Human Upgrade API - Agent Instructions

## Project Overview

The **Human Upgrade API** is a production-grade GraphQL API powering the Human Upgrade App—a biotech information platform inspired by Dave Asprey's _The Human Upgrade_ podcast. The API serves as the central intelligence hub for a multi-service ecosystem managing a comprehensive biotech knowledge graph, user profiles, and application features.

The system is built on a **dual-database architecture**:

- **Neo4j** - Knowledge graph for biotech entities, relationships, evidence, and unstructured content
- **PostgreSQL (Prisma)** - User profiles, preferences, notes, protocols, conversations, and app-specific features

---

## Tech Stack

### Core Infrastructure

- **Apollo Server** - GraphQL server with WebSocket support for subscriptions
- **GraphQL** - Type-safe API layer with schema-first development
- **TypeScript** - End-to-end type safety
- **Zod** - Runtime validation with TypeScript type inference
- **Neo4j** - Graph database for knowledge graph (Neo4j Aura)
- **PostgreSQL + Prisma** - Relational database for user data and app features
- **Express** - HTTP server foundation

### Supporting Services

- **Redis** - Pub/Sub for GraphQL subscriptions and rate limiting
- **S3** - Large content storage (transcripts, documents, exports)

---

## Architecture Overview

The API follows a **layered service architecture** with clear separation between knowledge graph operations and user data operations:

```
Resolvers (GraphQL Transport)
  → Services (Business Logic)
    → Zod Validators (Input Validation & Type Inference)
      → Neo4j Driver / Prisma Client (Data Access)
```

### Knowledge Graph Layer (Neo4j)

All biotech entities, relationships, evidence, documents, claims, and unstructured content are stored in Neo4j. This includes:

- Structured entities (Organization, Product, Person, Compound, Biomarker, LabTest, etc.)
- Unstructured evidence (Document, Chunk, Claim, EvidenceStrength, etc.)
- Relationships with temporal validity and evidence backing

### User Data Layer (PostgreSQL)

All user-specific data is stored in PostgreSQL via Prisma:

- User profiles, preferences, privacy settings
- Saved entities, collections, notes
- Protocols, biomarker tracking, recommendations
- Conversations, messages, assistant threads
- See `personal_docs/complete_refactor/user_profiles_and_app_features_prisma.md` for full schema

---

## Knowledge Graph Schema Pattern

### GraphQL Schema Structure

We model Neo4j nodes and relationships using a specific GraphQL pattern that exposes relationship properties as separate edge types:

**Pattern:**

```graphql
type NodeType {
  # Node properties
  nodeId: ID!
  name: String!
  ...

  # Relationships as edge types
  relationshipField: RelationshipEdgeType  # or [RelationshipEdgeType] for multiple
}

type RelationshipEdgeType {
  # The related node
  relatedNode: RelatedNodeType!

  # Relationship properties
  confidence: Float
  startDate: DateTime
  ...
}
```

**Example:**

```graphql
type Organization {
  organizationId: ID!
  name: String!
  orgType: String!
  ...

  offersProduct: OffersProductEdge  # Single relationship
  hasLocation: [HasLocationEdge!]!  # Multiple relationships
}

type OffersProductEdge {
  product: Product!

  # Relationship properties
  startDate: DateTime
  distributionRegions: [String!]
  ...
}
```

### Key Principles

1. **Nodes are GraphQL Types** - Each Neo4j node label becomes a GraphQL type
2. **Relationships are Edge Types** - Each relationship type becomes a GraphQL edge type containing:
   - The related node (always present)
   - Relationship properties (if any)
3. **Canonical IDs** - All nodes use stable canonical IDs (e.g., `organizationId`, `productId`)
4. **Merging Strategy** - Merge by canonical ID first, fallback to stable fields (e.g., `name` on Organization)
5. **Temporal Validity** - Relationships support `valid_at`, `invalid_at`, `expired_at` for time-versioned facts

---

## Implementation Approach

### Iterative Schema Construction

The knowledge graph schema is constructed **iteratively** from the ontology document:

**Source of Truth:** `api/personal_docs/complete_refactor/knowledge_graph_dump.md`

This document contains the complete Neo4j ontology including:

- Node definitions with all properties
- Relationship definitions with property specifications
- Enum values and constraints
- Temporal validity patterns
- Evidence-backed relationship patterns

### Implementation Steps (per entity set)

For each set of entities from the ontology:

1. **GraphQL Schema** - Create types, enums, and edge types in `src/graphql/schema.graphql`
2. **Zod Schemas** - Create validation schemas in `src/graphql/schemas/`:
   - Model schema (matches GraphQL output shape)
   - Mutation input schemas (with nested create support)
   - Infer TypeScript types from Zod
3. **Services** - Create service layer in `src/services/`:
   - Mutation services (create, update with MERGE logic)
   - Query services (fetch all, fetch by ID, return exact GraphQL shape)
4. **Resolvers** - Wire up GraphQL resolvers in `src/graphql/resolvers/`
5. **Pagination & Search** - Add pagination, filtering, and search capabilities
6. **Special Queries** - Add domain-specific queries as needed

### Standard Procedure (to be established)

After implementing the first set of entities, we will codify the pattern into a reusable procedure that can be applied to all subsequent entities.

---

## Data Sources & Reference Documents

### Knowledge Graph Ontology

**Location:** `api/personal_docs/complete_refactor/knowledge_graph_dump.md`

This document contains the complete Neo4j ontology definition including:

- All node types (Organization, Product, Person, Document, Chunk, Claim, etc.)
- All relationship types with property specifications
- Enum values and constraints
- Temporal validity conventions
- Evidence-backed relationship patterns

**Use this document as the authoritative source** when implementing GraphQL types, Zod schemas, and services.

### User Profiles & App Features

**Location:** `api/personal_docs/complete_refactor/user_profiles_and_app_features_prisma.md`

This document contains the Prisma schema for all user-related data:

- User profiles, preferences, privacy settings
- Saved entities, collections, queries
- Notes, documents, episodes, annotations
- Protocols, biomarker tracking
- Conversations, messaging, assistant threads
- Recommendations, trendings, digests

**This is implemented separately** in PostgreSQL using Prisma. The knowledge graph (Neo4j) and user data (PostgreSQL) are intentionally separated.

---

## Key Patterns & Conventions

### Zod Schema Pattern

Create two types of Zod schemas for each entity:

1. **Model Schema** - Matches the GraphQL output shape (not raw Neo4j structure)

   ```typescript
   const OrganizationSchema = z.object({
     organizationId: z.string(),
     name: z.string(),
     orgType: z.string(),
     offersProduct: OffersProductEdgeSchema.optional(),
     // ...
   });
   export type Organization = z.infer<typeof OrganizationSchema>;
   ```

2. **Mutation Input Schema** - Supports nested creates for outgoing relationships
   ```typescript
   const CreateOrganizationInputSchema = z.object({
     organizationId: z.string().optional(), // Auto-generated if not provided
     name: z.string(),
     offersProduct: z
       .object({
         create: CreateProductInputSchema, // Nested create
       })
       .optional(),
     // ...
   });
   ```

### Neo4j MERGE Pattern

Use MERGE for idempotent operations:

- Primary: Merge by canonical ID (e.g., `organizationId`)
- Fallback: Merge by stable field (e.g., `name`) if ID not provided
- Constraints: Neo4j constraints will be created for canonical IDs and stable fields

### Service Layer Pattern

Services handle:

- Input validation (using Zod schemas)
- Neo4j queries (MERGE operations, relationship creation)
- Data transformation (Neo4j results → GraphQL shape)
- Error handling
- Transaction management (when needed)

### DataLoader Pattern

Neo4j handles N+1 queries differently than MongoDB. DataLoader patterns may still be useful for:

- Batch loading related nodes
- Caching frequently accessed data
- Optimizing complex traversals

However, Neo4j's native query capabilities (single Cypher queries with multiple traversals) often eliminate the need for DataLoaders. Evaluate on a case-by-case basis.

---

## Directory Structure

```
api/src/
├── config/              # Environment configuration
├── db/
│   ├── neo4j/          # Neo4j driver, query utilities
│   │   ├── driver.ts
│   │   ├── query.ts
│   │   └── examples/
│   └── connection.ts   # PostgreSQL/Prisma (future)
├── graphql/
│   ├── schema.graphql  # GraphQL schema (built iteratively)
│   ├── schemas/        # Zod schemas (model + mutation)
│   ├── resolvers/      # GraphQL resolvers
│   ├── context.ts      # GraphQL context
│   └── types/          # TypeScript types (inferred from Zod)
├── services/           # Business logic layer
│   └── [entity]/       # Service per entity (e.g., organizationService.ts)
├── lib/                # Core utilities
│   ├── errors.ts       # Error handling
│   ├── logger.ts       # Logging
│   ├── validation.ts   # Zod validation helpers
│   └── ...
├── routes/             # Admin REST endpoints
└── server.ts           # Apollo Server setup
```

---

## Current State

### ✅ Infrastructure Complete

- **Neo4j Setup** - Driver configured and connected to Neo4j Aura
- **GraphQL Server** - Apollo Server with WebSocket support
- **Project Structure** - Directory structure established
- **Zod Integration** - Validation utilities in place
- **Error Handling** - Centralized AppError system
- **Logging** - Structured logging system

### 🚧 In Progress

- **GraphQL Schema** - Being built iteratively from ontology document
- **Service Layer** - First implementations being established
- **Resolvers** - Being wired up as schema is created

### 📋 Planned

- **Complete Schema** - All entities from ontology document
- **Pagination & Search** - Standard pagination and search patterns
- **User Profile Layer** - PostgreSQL/Prisma implementation
- **Subscriptions** - Real-time updates via Redis Pub/Sub
- **Rate Limiting** - Operation-specific rate limiting
- **Caching** - Query result caching strategies

---

## Important Notes

### Package Management

- **Use `pnpm`** for all package operations (per project preference)

### Testing

- Create official test files for new code (professional approach)
- Tests should validate both Zod schemas and service logic

### Validation

- All inputs must be validated with Zod schemas
- Use `validateInput()` helper from `src/lib/validation.ts`
- Infer TypeScript types from Zod schemas for type safety

### Neo4j Constraints

- Canonical IDs and stable fields will have Neo4j constraints created
- MERGE operations rely on these constraints for idempotency

### Temporal Validity

- Relationships support `valid_at`, `invalid_at`, `expired_at`
- Queries should filter by temporal validity when appropriate

### Evidence Backing

- Many relationships are backed by Claims and Chunks
- Consider evidence strength when querying relationships

---

## Development

### GraphQL Playground

- **URL:** `http://localhost:4000/graphql`
- **Introspection:** Enabled
- **WebSocket:** `ws://localhost:4000/graphql`

### Environment Configuration

- **Config:** `src/config/env.ts`
- **Neo4j:** Environment variables for Aura connection
- **PostgreSQL:** Environment variables for Prisma (when implemented)

### Key Files

- **Ontology Source:** `api/personal_docs/complete_refactor/knowledge_graph_dump.md`
- **User Schema Reference:** `api/personal_docs/complete_refactor/user_profiles_and_app_features_prisma.md`
- **Neo4j Driver:** `src/db/neo4j/driver.ts`
- **Neo4j Query Utils:** `src/db/neo4j/query.ts`

---

## Implementation Workflow

When implementing a new set of entities from the ontology:

1. **Read the ontology document** - Understand the node properties, relationships, and constraints
2. **Create GraphQL types** - Add to `src/graphql/schema.graphql`
3. **Create Zod schemas** - Model schema + mutation input schemas
4. **Create service layer** - Implement create, update, query operations
5. **Wire up resolvers** - Connect GraphQL to services
6. **Test thoroughly** - Validate schema, mutations, queries
7. **Document patterns** - Update this file or create pattern documentation if new patterns emerge

After the first implementation, codify the pattern into a reusable procedure for subsequent entities.

---

## Next Steps

1. Receive first set of entities from ontology document
2. Implement first complete example (GraphQL types → Zod schemas → Services → Resolvers)
3. Establish standard procedure/pattern
4. Iterate through remaining entities using established pattern
5. Implement pagination, search, and special queries
6. Implement user profile layer (PostgreSQL/Prisma)
