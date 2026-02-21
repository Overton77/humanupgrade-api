# Human Upgrade API - Agent Instructions

## Project Overview

The **Human Upgrade API** is a production GraphQL API powering the Human Upgrade App—a biotech information platform. The API manages a comprehensive biotech knowledge graph and will support user profiles and app features.

**Architecture:**

- **Neo4j** - Knowledge graph for biotech entities, relationships, evidence, and content
- **PostgreSQL (Prisma)** - User profiles, preferences, notes, protocols, conversations (to be implemented after KG)
- **GraphQL** - Type-safe API layer with schema-first development

## Tech Stack

- Apollo Server (GraphQL with WebSocket subscriptions)
- TypeScript + Zod (end-to-end type safety and validation)
- Neo4j (Aura) for knowledge graph
- PostgreSQL + Prisma for user data (future)
- Redis (Pub/Sub for subscriptions)
- S3 (large content storage)

## Implementation Patterns

### 1. GraphQL & Zod Schema Modeling

See: `.cursor/rules/graphql-zod-schema-modeling.mdc`

Key principles:

- **Edge Types**: Relationships modeled as edge types containing related node + relationship properties
- **Model Schemas**: Zod schemas match GraphQL output shape (not raw Neo4j structure)
- **Input Schemas**: Support nested `create`/`connect`/`update` for relationships
- **Type Inference**: TypeScript types inferred from Zod schemas

**Reference Files:**

- `src/graphql/types/OrganizationModel.ts` - Model schemas and edge types
- `src/graphql/inputs/OrganizationInputs.ts` - Input schemas with create/connect/update
- `src/graphql/schema.graphql` - GraphQL schema definition

### 2. Neo4j Create/Update Patterns

See: `.cursor/rules/neo4j-create-update-patterns.mdc`

Key principles:

- **MERGE by canonical ID**: Primary merge strategy, fallback to stable fields
- **UNWIND + CALL clauses**: Handle relationship arrays with sub-queries
- **Create/Connect/Update**: Support nested relationship operations
- **Temporal Validity**: All relationships support `validAt`, `invalidAt`, `expiredAt`

**Reference Files:**

- `src/services/Organization/organizationService.ts` - Complete create implementation

### 3. DataLoader Pattern

See: `.cursor/rules/dataloader-pattern.mdc`

Key principles:

- **Request-scoped**: Created per request in GraphQL context
- **Named by Model**: `Model.relationshipFieldEdges` naming convention
- **Returns Edge Types**: Matches GraphQL edge type shape (node + relationship props)

**Reference Files:**

- `src/graphql/loaders/entityLoaders.ts` - DataLoader implementations
- `src/graphql/context.ts` - Context creation with loaders
- `src/graphql/resolvers/organizationResolvers.ts` - Resolver usage

## Directory Structure

```
api/src/
├── graphql/
│   ├── schema.graphql           # GraphQL schema
│   ├── types/                   # Zod model schemas (output shape)
│   ├── inputs/                  # Zod input schemas (create/update)
│   ├── resolvers/               # GraphQL resolvers
│   ├── loaders/                 # DataLoader implementations (queries inline)
│   ├── context.ts               # GraphQL context with loaders
│   └── enums/                   # Enum definitions
├── services/                    # Business logic layer
│   └── [entity]/                # Service per entity
│       ├── [entity]Service.ts   # Business logic + queries (inline)
│       └── [entity]Queries.ts   # (Optional) Extract queries if file >500 lines
├── db/
│   └── neo4j/                   # Neo4j driver and query utilities
└── lib/                         # Utilities (errors, logger, validation)
```

**Query Organization:**

- **Services**: Keep Cypher queries inline in service files. Extract to `[Entity]Queries.ts` only if the service file exceeds ~500-600 lines.
- **DataLoaders**: Keep queries inline in `loaders/entityLoaders.ts` (tightly coupled to loader implementation).

## Data Sources

- **Knowledge Graph Ontology**: `personal_docs/complete_refactor/knowledge_graph_dump.md`
- **User Schema Reference**: `personal_docs/complete_refactor/user_profiles_and_app_features_prisma.md`
- **API Recommendations**: `personal_docs/complete_refactor/api_recommendations/`

## Development Workflow

1. **Define GraphQL Types** - Add to `schema.graphql`
2. **Create Zod Model Schema** - Matches GraphQL output shape in `types/`
3. **Create Zod Input Schemas** - With create/connect/update support in `inputs/`
4. **Implement Service Layer** - Neo4j CRUD operations in `services/`
5. **Wire Up Resolvers** - Connect GraphQL to services
6. **Add DataLoaders** - For relationship fields in `loaders/`

## Important Notes

- **Package Management**: Use `pnpm` for all operations
- **Validation**: All inputs validated with Zod schemas via `validateInput()` helper
- **Testing**: Create official test files for new code (professional approach)
- **Neo4j Dates**: Use `Neo4jDateString` (YYYY-MM-DD) and `Neo4jDateTimeString` (ISO datetime)
- **User Features**: PostgreSQL/Prisma implementation comes AFTER knowledge graph model services
