# HumanUpgrade API

A production-grade **GraphQL API** powering the Human Upgrade App—a biotech information platform inspired by Dave Asprey's _The Human Upgrade_ podcast. This API serves as the central intelligence hub for exploring and managing the complex relationships between businesses, products, research, protocols, and the people driving innovation in the biotech and consumer health optimization space.

---

## 🎯 Project Purpose

This project serves dual purposes:

**Value Validation**: Demonstrating how structured data and intelligent APIs can transform fragmented biotech information into actionable insights for health optimization and longevity research.

**Portfolio Showcase**: A comprehensive implementation showcasing modern backend architecture, GraphQL best practices, database design, and full-stack integration patterns.

---

## 🏗️ Architecture Overview

Built on a **layered service architecture** with strict separation of concerns:

```
Resolvers (Transport) → Services (Business Logic) →
Validators (Zod) → Input Types (Contracts) → Models (Persistence)
```

Each layer maintains distinct responsibilities, ensuring maintainability, testability, and clear data flow. The architecture emphasizes:

- **Type Safety**: End-to-end TypeScript with Zod runtime validation
- **Data Integrity**: ACID-compliant MongoDB transactions for multi-model operations
- **Performance**: DataLoader batching to eliminate N+1 queries
- **Reliability**: Centralized error handling with structured logging
- **Scalability**: Designed for both ingestion workloads and user-facing queries

---

## 🛠️ Technical Stack

### Core Technologies

- **Apollo Server** - GraphQL server with WebSocket subscriptions
- **GraphQL** - Type-safe API with schema-first design
- **TypeScript** - Full type coverage across all layers
- **Mongoose** - MongoDB ODM with bidirectional relationship management
- **Zod** - Runtime validation for all API inputs
- **Express** - Admin-facing REST endpoints

### Key Features

- **MongoDB Transactions** - Atomic multi-collection operations with session management
- **DataLoaders** - Automatic query batching to prevent N+1 problems
- **Bidirectional Relationships** - Canonical/mirror pattern with automatic sync
- **Vector Search** - Qdrant integration for semantic entity search
- **JWT Authentication** - Stateless auth with role-based access control
- **Type-Safe SDKs** - Generated TypeScript and Python client packages

---

## 🧬 Domain Model

The API manages the interconnected biotech ecosystem:

- **Business** - Companies developing health optimization solutions
- **Product** - Supplements, devices, and health tools
- **Person** - Researchers, entrepreneurs, and industry leaders
- **Compound** - Bioactive ingredients with clinical backing
- **Protocol** - Actionable health optimization frameworks
- **CaseStudy** - Clinical research and trial data
- **Episode** - Podcast content with transcripts and summaries
- **Article** - Research articles and external content
- **User** - Application users with personalized profiles
- **UserSaved** - User-curated collections (union type of all entities)

Relationships are managed through a sophisticated canonical/mirror pattern ensuring data consistency across complex many-to-many relationships.

---

## 🌐 Ecosystem Integration

This API is the backbone of a multi-service architecture:

- **LangGraph Research Engine** - Python-based multi-agent system for automated entity research and validation
- **Automated Ingestion Pipeline** - AWS Lambda/ECR service for continuous episode synchronization
- **Type-Safe SDKs** - Private TypeScript and Python packages exposing operational methods for cross-service communication
- **Next.js Frontend** - High-performance PWA for user-facing exploration and interaction

---

## 📂 Project Structure

```
api/
├── src/
│   ├── graphql/          # Schema, resolvers, inputs, loaders
│   │   ├── schema.graphql
│   │   ├── resolvers/   # Query/Mutation/Type resolvers
│   │   ├── inputs/       # TypeScript input types
│   │   ├── inputs/schemas/  # Zod validation schemas
│   │   ├── loaders/      # DataLoader implementations
│   │   └── operations/   # GraphQL operations for SDK generation
│   ├── services/         # Business logic layer
│   │   ├── BaseService.ts
│   │   └── [entity]Service.ts
│   ├── models/           # Mongoose schemas with relationship sync
│   ├── lib/              # Core utilities
│   │   ├── errors.ts     # Centralized error handling
│   │   ├── validation.ts # Zod validation utilities
│   │   ├── transactions.ts # MongoDB transaction wrappers
│   │   └── logger.ts     # Structured logging
│   ├── db/               # MongoDB connection
│   ├── routes/           # Admin REST endpoints
│   └── config/           # Environment configuration
├── sdks/                 # Generated client packages
└── scripts/              # Migration and maintenance utilities
```

---

## 🔐 Authentication & Authorization

- **Public Queries**: Entity listings, searches, and single-entity queries (rate limiting planned)
- **Authenticated**: User profile operations, saved entities, personal queries
- **Admin Required**: CRUD operations on official entities (Business, Product, Person, Episode, Compound, CaseStudy)
- **Special Cases**: User and Protocol entities have custom authorization rules

---

## 🚀 Key Capabilities

### Entity Management

- Full CRUD operations for all biotech entities
- Nested entity creation (e.g., create Business with nested Owners/Products)
- Relationship management with automatic bidirectional sync
- Vector search for semantic entity discovery

### User Features

- Profile creation and management with health goals
- Save entities to personal collections
- User preferences and entity filtering
- (In Progress) User-created protocols and notes

### Data Integrity

- Zod validation on all inputs (runtime + compile-time safety)
- MongoDB transactions for atomic multi-step operations
- Automatic relationship synchronization
- Comprehensive error handling with structured responses

### Performance

- DataLoader batching eliminates N+1 queries
- Efficient relationship traversal via mirror fields
- Vector search for semantic queries
- (Planned) Redis caching for high-frequency queries

---

## 📚 Development Guidelines

This project maintains comprehensive development guidelines in `.cursor/rules/` covering:

- **Architecture Patterns** - Layered service architecture and separation of concerns
- **Service Patterns** - BaseService extension, validation, transactions, error handling
- **Model Relationships** - Canonical/mirror sync patterns for bidirectional relationships
- **GraphQL Patterns** - Input validation, resolver patterns, DataLoader usage
- **Transaction Patterns** - MongoDB transaction management and session handling
- **Error Handling** - Centralized AppError system with HTTP status codes

These rules serve as reference documentation for code review and refactoring. The codebase is primarily hand-written with these guidelines ensuring consistency and maintainability.

---

## 🧪 Current Status

### ✅ Production-Ready Features

- Complete CRUD operations for all core entities
- User authentication and profile management
- Entity search and filtering
- Relationship management with automatic sync
- GraphQL API fully operational
- Type-safe SDK generation
- Admin REST endpoints

### 🚧 In Development

- User Protocols - Custom protocol creation and management
- Notes System - User annotations on entities
- Recommendations Engine - Personalized entity suggestions
- Trending Engine - Trend analysis and display
- Enhanced Vector Search - Full Qdrant integration (currently limited by MongoDB Atlas free-tier index constraints)

---

## 🛡️ Reliability Features

- **Dual Validation**: GraphQL schema + Zod runtime validation
- **ACID Transactions**: Multi-collection operations with automatic rollback
- **Structured Logging**: Comprehensive audit trail across service layer
- **Error Normalization**: All errors converted to structured AppError responses
- **Session Management**: Transaction-aware operations with proper cleanup

---

## 📖 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- pnpm (package manager)

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# GraphQL Playground
# http://localhost:4000/graphql
```

### Environment

Configure environment variables in `src/config/env.ts`:

- MongoDB connection string
- JWT secret
- Qdrant configuration (for vector search)

---

## 🔮 Roadmap

- [ ] Redis caching for high-frequency queries
- [ ] Rate limiting for public endpoints
- [ ] Full Qdrant vector search integration
- [ ] User Protocols and Notes features
- [ ] Recommendations and Trending engines
- [ ] Enhanced entity schemas (Business, Product, CaseStudy)

---

## 📝 Notes

This API is part of a larger ecosystem demonstrating modern full-stack development practices. The implementation prioritizes:

- **Code Quality**: Type safety, validation, and error handling at every layer
- **Maintainability**: Clear architecture with documented patterns
- **Performance**: Optimized queries and relationship traversal
- **Reliability**: Transactions, validation, and comprehensive error handling

The project serves both as a functional biotech information platform and a demonstration of production-grade API design and implementation.

---

_This API is actively developed and represents a value validation project showcasing modern backend engineering practices._
