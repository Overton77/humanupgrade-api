# HumanUpgrade API

A powerful GraphQL API for exploring cutting-edge biotech companies, longevity products, health compounds, and insights from Dave Asprey's _The Human Upgrade_ podcast. Built to showcase advanced full-stack development while delivering real value through curated health and performance optimization data.

## 🎯 Project Overview

This API serves as the backbone of the HumanUpgrade application, providing structured access to:

- **900+ Episodes** from _The Human Upgrade_ podcast with transcripts, summaries, and structured metadata
- **Biotech Companies** - Innovative companies at the forefront of human performance
- **Products** - Cutting-edge supplements and health optimization tools
- **Compounds** - Individual bioactive compounds with detailed information
- **Case Studies** - Research and clinical data supporting various health interventions
- **People** - Industry leaders, researchers, and podcast guests

The data is powered by custom LLM-based research pipelines and web scraping systems, delivering comprehensive, up-to-date information for health-conscious users and biohackers.

## 🚀 Tech Stack

- **Runtime**: Node.js with TypeScript
- **API Framework**: Apollo Server + Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Vector Database**: Qdrant (for upcoming semantic search features)
- **Package Manager**: pnpm
- **Development**: tsx with hot-reload

## ✨ Features

### Current Features

- **GraphQL API** with type-safe schema and resolvers
- **JWT Authentication** - Secure user registration and login
- **User Collections** - Save and manage episodes, products, and businesses
- **Complex Entity Relationships** - Advanced Mongoose schema with bidirectional syncing
  - Products ↔ Businesses
  - Episodes ↔ Guests (People)
  - Episodes ↔ Sponsors (Businesses)
  - Products ↔ Compounds
  - Compounds ↔ Case Studies
  - People ↔ Businesses (with executive roles)
- **Rich Metadata** - Sponsor links, discount codes, episode timelines, YouTube integration
- **Nested Mutations** - Create/update entities with related data in a single operation
- **S3 Integration** - Episode transcripts stored and served from S3

### 🔮 Upcoming Features

- **Vector Search** - Semantic search across all entities using Qdrant
- **Full-Text Search** - MongoDB text indexes for fast keyword search
- **Real-time Autocomplete** - Type-ahead search with instant suggestions
- **Recommendations Engine** - Personalized content recommendations based on user interests
- **GraphQL Codegen SDK** - Auto-generated TypeScript SDK for client applications
- **Rate Limiting** - API protection and fair usage policies

## 📊 Data Models

The API manages seven core entities with complex relationships:

### Core Entities

1. **Episode** - Podcast episode with full metadata, transcripts, and sponsor information
2. **Business** - Companies in the health/biotech space with their products and executives
3. **Product** - Supplements and health tools with ingredient breakdowns
4. **Compound** - Individual bioactive compounds (vitamins, minerals, nootropics, etc.)
5. **Person** - Industry figures, podcast guests, and company executives
6. **CaseStudy** - Research and clinical trials supporting various health claims
7. **User** - Application users with authentication and saved content

### Relationship Highlights

- **Many-to-Many**: Products ↔ Compounds, Episodes ↔ Guests, Episodes ↔ Sponsors
- **One-to-Many**: Business → Products
- **Complex**: Business.executives[] with roles (CEO, Founder, etc.)

## 📁 Project Structure

```
api/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment variable configuration
│   ├── db/
│   │   └── connection.ts             # MongoDB connection setup
│   ├── graphql/
│   │   ├── inputs/                   # GraphQL input types for mutations
│   │   ├── resolvers/
│   │   │   ├── Query.ts              # Query resolvers
│   │   │   ├── Mutation.ts           # Mutation resolvers
│   │   │   └── index.ts              # Combined resolvers export
│   │   └── schema.graphql            # GraphQL schema definition
│   ├── models/                       # Mongoose models with advanced sync logic
│   │   ├── Business.ts
│   │   ├── CaseStudy.ts
│   │   ├── Compound.ts
│   │   ├── Episode.ts
│   │   ├── MediaLink.ts
│   │   ├── Person.ts
│   │   ├── Product.ts
│   │   └── User.ts
│   ├── services/                     # Business logic and data access layer
│   │   ├── auth.ts                   # JWT token generation and validation
│   │   ├── businessService.ts
│   │   ├── caseStudyService.ts
│   │   ├── compoundService.ts
│   │   ├── episodeService.ts
│   │   ├── personService.ts
│   │   ├── productService.ts
│   │   ├── qdrant.ts                 # Vector database client
│   │   ├── userService.ts
│   │   └── utils/                    # Shared utilities
│   │       ├── general.ts            # General helper functions
│   │       ├── mapping.ts            # Data transformation utilities
│   │       ├── merging.ts            # Entity merging logic
│   │       └── validation.ts         # Input validation helpers
│   └── server.ts                     # Apollo Server + Express setup
├── scripts/
│   └── oneoffs/                      # One-time scripts and utilities
│       ├── createAdmin.ts
│       ├── storeCurrentEpisodes.ts
│       └── storeCurrentEpisodeS3links.ts
├── personal_docs/                    # Development documentation
│   ├── nov-30-mongoose-report.md
│   ├── relationship-diagrams.md
│   ├── sync-cheat-sheet.md
│   ├── sync-examples.md
│   └── sync-methods-reference.md
├── docker-compose.yml                # Docker setup for MongoDB and Qdrant
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

## 🛠 Setup & Installation

### Prerequisites

- Node.js (v18+)
- pnpm (v10+)
- MongoDB (local or Atlas)
- Qdrant (optional, for vector search features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd humanupgradeapp/api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the `api/` directory:

   ```env
   # Server
   PORT=4000

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/humanupgrade
   SEED_DB_NAME=your_seed_db_name
   SEED_DB_COLLECTION_NAME=your_collection_name

   # JWT Authentication
   JWT_SECRET=your-super-secure-secret-key

   # AWS S3 (for transcripts)
   HU_TRANSCRIPT_BUCKET=your-s3-bucket-name

   # Qdrant Vector Database (optional, for upcoming features)
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=your-qdrant-api-key
   QDRANT_COLLECTION_NAME=human-upgrade
   QDRANT_VECTOR_DIMENSION=1536
   ```

4. **Start MongoDB and Qdrant (optional)**

   Using Docker:

   ```bash
   docker-compose up -d
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   ```

   The GraphQL playground will be available at `http://localhost:4000/graphql`

## 🔐 Authentication

The API uses JWT-based authentication. To access protected resources:

1. **Register a new user**

   ```graphql
   mutation {
     register(
       email: "user@example.com"
       password: "securepassword"
       name: "John Doe"
     ) {
       token
       user {
         id
         email
         name
       }
     }
   }
   ```

2. **Login**

   ```graphql
   mutation {
     login(email: "user@example.com", password: "securepassword") {
       token
       user {
         id
         email
         name
       }
     }
   }
   ```

3. **Use the token in subsequent requests**

   Add the token to the Authorization header:

   ```
   Authorization: Bearer <your-jwt-token>
   ```

## 📚 API Usage Examples

### Query Episodes

```graphql
query {
  episodes(limit: 10, offset: 0) {
    id
    episodeNumber
    episodeTitle
    publishedAt
    summaryShort
    guests {
      name
      role
    }
    sponsorBusinesses {
      name
      website
    }
  }
}
```

### Get Product Details with Related Compounds

```graphql
query {
  product(id: "product-id") {
    name
    description
    business {
      name
      website
    }
    compounds {
      name
      description
      caseStudies {
        title
        summary
        sourceType
      }
    }
  }
}
```

### Create a Business with Nested Products

```graphql
mutation {
  createBusiness(
    input: {
      name: "SuperBio Labs"
      description: "Cutting-edge longevity supplements"
      website: "https://superbio.example"
      productIds: []
    }
  ) {
    id
    name
    products {
      name
    }
  }
}
```

### Save/Unsave Content (Toggle)

```graphql
mutation {
  toggleSaveEpisode(episodeId: "episode-id") {
    id
    savedEpisodes {
      episodeTitle
    }
  }
}
```

## 🧬 Advanced Features

### Bidirectional Relationship Synchronization

One of the most complex aspects of this API is the **bidirectional relationship synchronization** using Mongoose middleware. When you update one entity, all related entities automatically sync their references.

**Example**: When you add a product to a business, the product's `business` field automatically updates to reference that business.

**Implementation Details**:

- Custom Mongoose pre/post hooks on `save`, `findOneAndUpdate`, and `findOneAndDelete`
- Intelligent diffing to determine added vs. removed relationships
- Atomic operations to prevent race conditions
- Comprehensive error handling and rollback mechanisms

See `personal_docs/sync-methods-reference.md` for detailed documentation.

### Nested Input Mutations

The API supports creating or updating entities along with their relationships in a single mutation:

- **With IDs**: Reference existing entities by ID
- **With Nested Objects**: Create new related entities inline
- **Mixed Mode**: Combine both approaches

**Example**: Create a product and link it to existing compounds by ID, or define new compounds inline.

### Rich Episode Metadata

Episodes include:

- **Sponsor Link Objects**: Parsed sponsor information with discount codes
- **Web Page Timelines**: Timestamped segments from the episode webpage
- **Takeaways**: Key insights extracted via LLM
- **Multiple Links**: YouTube, transcript, episode page, S3 storage

## 🗄 Database Schema Highlights

### Complex Embedded Documents

- **MediaLink**: Flexible links (website, social media, documentation)
- **SponsorLinkObject**: Sponsor details with discount codes
- **WebPageTimeline**: Episode segments with timestamps
- **BusinessExecutive**: Person + role/title metadata

### Indexing Strategy

- Unique indexes on critical fields (email, episode numbers)
- Compound indexes for common query patterns
- Text indexes (planned) for search functionality

## 🧪 Scripts

Located in `scripts/oneoffs/`:

- **createAdmin.ts**: Create an admin user for testing
- **storeCurrentEpisodes.ts**: Bulk import episodes from data pipeline
- **storeCurrentEpisodeS3links.ts**: Update S3 transcript URLs

Run with:

```bash
npx tsx scripts/oneoffs/<script-name>.ts
```

## 🏗 Architecture Decisions

### Service Layer Pattern

Business logic is separated into dedicated service files, keeping resolvers thin and focused on GraphQL-specific concerns.

### Input Validation

- Schema-level validation via GraphQL types
- Runtime validation in service layer
- Mongoose schema validation as final safety net

### Error Handling

- Descriptive error messages for client consumption
- Logged stack traces for debugging
- Graceful fallbacks for non-critical failures

## 🤝 Related Projects

This API is part of the larger HumanUpgrade ecosystem:

- **Client Application**: React-based web app for exploring the data
- **LLM Research Pipeline**: Automated content analysis and summarization
- **Web Scraper**: Data ingestion from podcast transcripts and biotech company websites
- **GraphQL SDK** (upcoming): Type-safe client library for consuming this API

## 🎨 Project Philosophy

This project showcases:

1. **Real-World Value**: Not just a demo—a functional tool for health optimization
2. **Technical Excellence**: Advanced patterns, clean architecture, production-ready code
3. **Modern Stack**: Latest versions, best practices, scalable design
4. **Comprehensive Data**: 900+ episodes, hundreds of products, deep relationship graphs
5. **Future-Proof**: Built with extensibility in mind (vector search, recommendations, etc.)

## 🚧 Development Roadmap

### Phase 1: Core API ✅

- [x] GraphQL schema design
- [x] Mongoose models with relationship syncing
- [x] JWT authentication
- [x] CRUD operations for all entities
- [x] Nested mutations

### Phase 2: Search & Discovery (In Progress)

- [ ] Qdrant vector database integration
- [ ] Semantic search across entities
- [ ] MongoDB text search
- [ ] Real-time autocomplete API
- [ ] Search result ranking algorithm

### Phase 3: Intelligence Layer

- [ ] Personalized recommendations
- [ ] User preference learning
- [ ] Related content suggestions
- [ ] Trending topics identification

### Phase 4: Developer Experience

- [ ] GraphQL Codegen SDK
- [ ] Comprehensive API documentation
- [ ] Example client implementations
- [ ] Rate limiting and quotas
- [ ] API versioning strategy

## 📄 License

This project is part of a personal portfolio and learning initiative.

## 👤 Author

Built with ❤️ as a demonstration of modern full-stack development capabilities and a genuine passion for health optimization technology.

---

**Note**: This API contains data curated from public sources and is intended for educational and personal use. All podcast content is attributed to Dave Asprey and _The Human Upgrade_.
