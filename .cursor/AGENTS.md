# Human Upgrade API - Agent Instructions

## Project Overview

The **Human Upgrade API** is a MongoDB-powered GraphQL API for the Human Upgrade App, inspired by Dave Asprey's _The Human Upgrade_ podcast and the biotech/consumer biotech industry. It serves as the central intelligence hub for a multi-service ecosystem managing biotech entities: products, businesses, research, protocols, and user profiles.

## Tech Stack

- **Apollo Server** - GraphQL server with WebSocket support
- **GraphQL** - API layer with type-safe queries and mutations
- **TypeScript** - Type-safe development
- **Mongoose** - MongoDB ODM with relationship management
- **Zod** - Runtime validation for all inputs
- **Express** - Admin-facing REST endpoints

## Architecture

The API follows a **layered service architecture** with clear separation of concerns:

```
Resolvers (Transport/Orchestration) → Services (Business Logic) →
Input Validators (Zod Schemas) → Input Types (TypeScript Interfaces) →
DB Models (Mongoose Schemas)
```

Each layer has distinct responsibilities. See `.cursor/rules/architecture-layers.mdc` for detailed patterns.

## Purpose

The API serves three main purposes:

1. **Ingestion** - Receiving entities from manual research and automated research agents (LangGraph-based Python system)
2. **User-Facing Operations** - Profile management, entity search, saving entities, recommendations, trends
3. **Administrative** - Admin REST endpoints for seeding and maintenance

## Core Entities

- **Business** - Companies in the biotech space
- **Product** - Health optimization products
- **Person** - Industry leaders, researchers, podcast guests
- **Compound** - Bioactive ingredients
- **Protocol** - Health optimization frameworks
- **CaseStudy** - Clinical research and trials
- **Episode** - Podcast episodes with transcripts and summaries
- **Article** - Research articles and content
- **User** - Application users with authentication
- **UserProfile** - User preferences, goals, and settings
- **UserSaved** - User-saved entities (union type of all entities)

## Current State

### ✅ Complete (80%)

- **Project Structure** - Consolidated and organized
- **Cursor Rules** - Comprehensive rules in `.cursor/rules/` for patterns and guidance
- **CRUD Operations** - Main entities (Business, Product, Person, Compound, Protocol, CaseStudy, Episode)
- **User Management** - UserSaved and UserProfile creation/management
- **GraphQL API** - Running at `localhost:4000/graphql`
- **Authentication** - JWT-based auth with role-based access control
- **Data Loaders** - N+1 prevention for GraphQL queries
- **Relationship Sync** - Bidirectional relationship management (canonical/mirror pattern)
- **Input Validation** - Zod schemas for all inputs
- **Error Handling** - Centralized AppError system
- **Transactions** - Multi-model atomic operations

### 🚧 Incomplete

- **User Protocols** - User-created protocol functionality (to be implemented)
- **Notes** - User notes on entities (to be implemented)
- **Recommendations Engine** - Entity recommendation system (to be implemented)
- **Trending Engine** - Trend analysis and display (to be implemented)
- **Entity Enhancements** - Business, Product, CaseStudy need additional fields/features
- **Vector Search Integration** - Full Qdrant integration for vector search (currently limited by free-tier MongoDB Atlas index constraints)

## Key Patterns & Rules

Refer to `.cursor/rules/` for detailed guidance:

- **`architecture-layers.mdc`** - Layer separation and responsibilities
- **`model-relationships.mdc`** - Bidirectional relationship sync patterns
- **`service-patterns.mdc`** - Service layer patterns, BaseService, validation, transactions
- **`error-handling.mdc`** - Centralized error handling with AppError
- **`graphql-validation.mdc`** - Input types, Zod schemas, validation flow
- **`transactions.mdc`** - MongoDB transaction patterns
- **`dataloader-patterns.mdc`** - N+1 prevention in GraphQL resolvers

## Directory Structure

```
src/
├── config/          # Environment configuration
├── db/              # MongoDB connection
├── graphql/         # GraphQL schema, inputs, resolvers, loaders
├── lib/             # Core utilities (errors, logger, validation, transactions)
├── models/          # Mongoose schemas with relationship sync
├── services/        # Business logic layer
├── routes/          # Admin REST endpoints
└── server.ts        # Apollo Server setup
```

## Important Notes

- **Package Manager**: Use `pnpm` for all package operations
- **Testing**: Create official test files for new code (professional approach)
- **Transactions**: Use for multi-model operations; see `transactions.mdc` for when to use
- **Authorization**: Admin required for CRUD on official entities; User/Protocol have special rules
- **Data Loaders**: Always use `ctx.loaders` in type resolvers, never query models directly
- **Validation**: All inputs must be validated with Zod schemas via `validateInput()`

## Development

- GraphQL Playground: `http://localhost:4000/graphql`
- Admin REST endpoints: See `src/routes/`
- Environment config: `src/config/env.ts`
- MongoDB connection: `src/db/connection.ts`

When implementing new features, follow the layered architecture and refer to the appropriate rule files for patterns and best practices.
