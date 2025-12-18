# HumanUpgrade API | V1

The **HumanUpgrade API** is the central intelligence hub and data contract for a multi-service ecosystem inspired by Dave Asprey’s _The Human Upgrade_ podcast. It provides a structured, high-performance GraphQL interface to the biotech industry's most critical entities: products, businesses, research, and longevity protocols.

---

## 🌐 The Ecosystem Context

This API is the backbone of a sophisticated, multi-service architecture:

- **LangGraph Research Engine:** A multi-agent asynchronous Python system utilizing advanced agentic techniques (memory management, context offloading to the filesystem, and LangSmith observability) to ingest, validate, and research biotech entities.
- **Automated Ingestion Pipeline:** An AWS Lambda-invoked ECR image that continuously synchronizes the MongoDB episodes collection, ensuring the platform stays current with the latest podcast insights.
- **The SDKs:** This API is compiled into private **TypeScript and Python packages**, exposing type-safe operational methods (e.g., `createBusinessWithRelationInputs`) used for seamless communication across all services.
- **Next.js Frontend:** A high-performance PWA designed for informational exploration of the people, businesses, and protocols within the human upgrade landscape.

---

## 🏛️ Architecture & Technical Pillars

The API is built for data integrity and reliability, serving as the "Source of Truth" for the biotech entity schema.

### 🛡️ Core Reliability Features

- **Zod Schema Validation:** Every input is strictly validated at runtime using Zod, providing a secondary layer of safety beyond the GraphQL schema.
- **MongoDB Transactions:** Multi-step, cross-collection operations are wrapped in ACID-compliant transactions to ensure data consistency.
- **Global Error Handling:** A centralized strategy for capturing, logging, and transforming system errors into meaningful GraphQL responses.
- **Structured Logging:** Comprehensive logging across the service layer for auditing and real-time observability.
- **JWT Token Validation:** Secure, stateless authentication for user profiles and protected operations.

### 🧬 Data Entities (The Contracts)

The API manages the complex relationships between the core pillars of the biotech world:

- **Business & Product:** Innovative companies and their health-optimization tools.
- **Person:** Industry leaders, researchers, and podcast guests.
- **Compound & CaseStudy:** Bioactive ingredients backed by clinical research and trials.
- **Protocol:** Actionable health frameworks for performance optimization.
- **User:** Personalized profiles allowing users to save and track entities.

---

## 📂 Project Structure

```text
api/
├── src/
│   ├── graphql/          # Type definitions and Query/Mutation resolvers
│   ├── services/         # Business logic and data access layer
│   ├── models/           # Mongoose schemas with bidirectional syncing logic
│   ├── lib/              # Core pillars: logger, validation, transactions, errors
│   ├── db/               # MongoDB connection management
│   ├── routes/           # REST endpoints for specialized tasks (e.g., seeding)
│   └── config/           # Environment and global configuration
├── sdks/                 # Generated Python & TS client packages
└── scripts/              # Migration and maintenance utilities
```

---

## 🔮 Roadmap (Production Readiness)

We are actively moving towards a production-grade release with:

- [ ] **Advanced Caching:** Redis-backed caching for high-frequency queries.
- [ ] **Rate Limiting:** Protection against API abuse and high-volume scraping.
- [ ] **Enhanced Vector Search:** Fully integrated semantic exploration via Qdrant.
- [ ] **Protocol Expansion:** Richer schema support for complex biohacking stacks.

---

## 👤 Author & Philosophy

This project is built to bridge the gap between fragmented biotech data and actionable human performance insights, maintaining high-end engineering standards at every layer of the stack.

---

_Note: This API is functional but under active development (V1)._
