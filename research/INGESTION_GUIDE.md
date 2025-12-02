# Eng3 Corporation / NanoVi Data Ingestion Guide

## Overview

This folder contains comprehensive research on Eng3 Corporation, the NanoVi product line, key personnel, and associated clinical studies. The data has been structured to align with your HumanUpgrade API database schema.

## Files in This Research

1. **eng3-nanovi-research.md** - Complete narrative research document with all findings
2. **eng3-nanovi-entities.json** - Structured JSON data ready for database ingestion
3. **INGESTION_GUIDE.md** (this file) - Instructions for importing data

## Data Structure

### Entities Included

- **1 Business:** Eng3 Corporation
- **2 People:** Hans Eng (Founder/CEO), Rowena Gates (Co-founder/VP)
- **3 Products:** NanoVi Eco, NanoVi Pro, NanoVi Exo
- **1 Compound:** Structured Water (EZ Water)
- **5 Case Studies:** Multiple clinical studies and trials

## Ingestion Steps

### Option 1: Manual Creation via GraphQL Mutations

#### Step 1: Create the Business

```graphql
mutation CreateEng3 {
  createBusiness(
    input: {
      name: "Eng3 Corporation"
      description: "Eng3 Corporation is a medical device company founded in 2003 that develops, manufactures, and distributes NanoVi® devices..."
      website: "https://eng3corp.com"
      mediaLinks: [
        {
          label: "Official Website"
          url: "https://eng3corp.com"
          type: "website"
        }
        {
          label: "Facebook"
          url: "https://www.facebook.com/eng3corp/"
          type: "social"
        }
        # ... add other media links
      ]
    }
  ) {
    id
    name
    website
  }
}
```

Save the returned `id` as `ENG3_BUSINESS_ID`.

#### Step 2: Create the People

```graphql
mutation CreateHansEng {
  createPerson(
    input: {
      name: "Hans Eng"
      role: "Founder and CEO"
      bio: "Originally from Berlin, Germany, Hans Eng is the founder..."
      mediaLinks: [
        {
          label: "Company Profile"
          url: "https://eng3corp.com/about-eng3-corp/#abouthans"
          type: "profile"
        }
      ]
      businessIds: ["<ENG3_BUSINESS_ID>"]
    }
  ) {
    id
    name
    role
  }
}

mutation CreateRowenaGates {
  createPerson(
    input: {
      name: "Rowena Gates"
      role: "Vice President of Business Development, Co-founder"
      bio: "A native of Vancouver, Canada, Rowena Gates is a principal..."
      mediaLinks: [
        {
          label: "Company Profile"
          url: "https://eng3corp.com/about-eng3-corp/#aboutrowena"
          type: "profile"
        }
        {
          label: "Making Bank Podcast"
          url: "https://eng3corp.com/about/blog/making-bank-podcast/"
          type: "podcast"
        }
        # ... add other media links
      ]
      businessIds: ["<ENG3_BUSINESS_ID>"]
    }
  ) {
    id
    name
    role
  }
}
```

Save the returned IDs as `HANS_ENG_ID` and `ROWENA_GATES_ID`.

#### Step 3: Update Business with Executives

```graphql
mutation UpdateEng3Executives {
  updateBusinessRelations(
    input: {
      id: "<ENG3_BUSINESS_ID>"
      executives: [
        {
          personId: "<HANS_ENG_ID>"
          title: "Founder and CEO"
          role: "Executive"
        }
        {
          personId: "<ROWENA_GATES_ID>"
          title: "Co-founder and VP Business Development"
          role: "Executive"
        }
      ]
    }
  ) {
    id
    executives {
      person {
        name
      }
      title
      role
    }
  }
}
```

#### Step 4: Create the Compound

```graphql
mutation CreateStructuredWater {
  createCompound(
    input: {
      name: "Structured Water"
      description: "Structured water, also known as Exclusion Zone (EZ) water..."
      aliases: [
        "EZ Water"
        "Exclusion Zone Water"
        "Fourth-Phase Water"
        "Coherent Water"
        "Coherent Domains"
        "Interfacial Water"
      ]
      mediaLinks: [
        {
          label: "Water Science Research"
          url: "https://eng3corp.com/how-nanovi-works-as-a-protein-folding-therapy/"
          type: "research"
        }
        {
          label: "Dr. Pollack EZ Water Research"
          url: "https://eng3corp.com/about/blog/dr-pollack-exclusion-zone-water-hans-eng/"
          type: "research"
        }
      ]
    }
  ) {
    id
    name
    aliases
  }
}
```

Save the returned `id` as `STRUCTURED_WATER_ID`.

#### Step 5: Create the Products

```graphql
mutation CreateNanoViEco {
  createProduct(
    input: {
      name: "NanoVi Eco"
      businessId: "<ENG3_BUSINESS_ID>"
      description: "The NanoVi Eco® is the most economical way to bring the benefits of NanoVi® technology..."
      ingredients: [
        "Infrared radiation technology"
        "Humidity generation system"
        "Coherent domain water generation"
        "Bio-identical signaling mechanism"
      ]
      sourceUrl: "https://eng3corp.com/introduction-to-the-nanovi/"
      mediaLinks: [
        {
          label: "Product Information"
          url: "https://eng3corp.com/introduction-to-the-nanovi/"
          type: "product_page"
        }
        {
          label: "How NanoVi Works"
          url: "https://eng3corp.com/how-nanovi-works-as-a-protein-folding-therapy/"
          type: "documentation"
        }
      ]
      compoundIds: ["<STRUCTURED_WATER_ID>"]
    }
  ) {
    id
    name
    business {
      name
    }
  }
}

mutation CreateNanoViPro {
  createProduct(
    input: {
      name: "NanoVi Pro"
      businessId: "<ENG3_BUSINESS_ID>"
      description: "The NanoVi Pro® is the perfect tradeoff between price and performance..."
      ingredients: [
        "Advanced infrared radiation technology"
        "Enhanced humidity generation system"
        "Coherent domain water generation"
        "Bio-identical signaling mechanism"
        "Professional-grade signal strength (2x)"
      ]
      sourceUrl: "https://eng3corp.com/introduction-to-the-nanovi/"
      mediaLinks: [
        {
          label: "Product Information"
          url: "https://eng3corp.com/introduction-to-the-nanovi/"
          type: "product_page"
        }
      ]
      compoundIds: ["<STRUCTURED_WATER_ID>"]
    }
  ) {
    id
    name
  }
}

mutation CreateNanoViExo {
  createProduct(
    input: {
      name: "NanoVi Exo"
      businessId: "<ENG3_BUSINESS_ID>"
      description: "The NanoVi Exo® is the newest and most powerful NanoVi® option..."
      ingredients: [
        "Maximum-power infrared radiation technology"
        "High-efficiency humidity generation system"
        "Enhanced coherent domain water generation"
        "Bio-identical signaling mechanism"
        "Elite-grade signal strength (4x)"
      ]
      sourceUrl: "https://eng3corp.com/introduction-to-the-nanovi/"
      mediaLinks: [
        {
          label: "Product Information"
          url: "https://eng3corp.com/introduction-to-the-nanovi/"
          type: "product_page"
        }
      ]
      compoundIds: ["<STRUCTURED_WATER_ID>"]
    }
  ) {
    id
    name
  }
}
```

Save the returned IDs as `NANOVI_ECO_ID`, `NANOVI_PRO_ID`, and `NANOVI_EXO_ID`.

#### Step 6: Create Case Studies

```graphql
mutation CreateProteinRepairStudy {
  createCaseStudy(
    input: {
      title: "Effect of Humid Air Exposed to IR Radiation on Enzyme Activity - Protein Repair from Oxidative, Heat, and Chemical Damage"
      summary: "Peer-reviewed study published in the International Journal of Molecular Sciences investigating NanoVi's ability to protect and restore protein activity when exposed to damaging factors including heat, oxidation, and chemical denaturants..."
      url: "https://pubmed.ncbi.nlm.nih.gov/35054784/"
      sourceType: PUBMED
      compoundIds: ["<STRUCTURED_WATER_ID>"]
    }
  ) {
    id
    title
    sourceType
  }
}

mutation CreateVO2MaxStudy {
  createCaseStudy(
    input: {
      title: "Metabolic Testing Confirms 7.8% VO2 Max Improvement After Single NanoVi Session"
      summary: "Clinical metabolic testing study demonstrated that a single 20-minute session with the NanoVi device resulted in a 7.8% improvement in VO2 max..."
      url: "https://eng3corp.com/about/blog/metabolic-testing-confirms-nanovi-benefits-after-one-session"
      sourceType: CLINICAL_TRIAL
      compoundIds: ["<STRUCTURED_WATER_ID>"]
    }
  ) {
    id
    title
  }
}

# ... Continue with other case studies
```

### Option 2: Automated Script Ingestion

Create a script file `scripts/oneoffs/ingestEng3Data.ts`:

```typescript
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Business } from "../../src/models/Business";
import { Person } from "../../src/models/Person";
import { Product } from "../../src/models/Product";
import { Compound } from "../../src/models/Compound";
import { CaseStudy } from "../../src/models/CaseStudy";
import { env } from "../../src/config/env";

async function ingestEng3Data() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Read the JSON data
    const dataPath = path.join(
      __dirname,
      "../../research/eng3-nanovi-entities.json"
    );
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    // 1. Create Business
    console.log("Creating Eng3 Corporation...");
    const business = await Business.create(data.business);
    console.log(`✅ Created business: ${business.name} (ID: ${business._id})`);

    // 2. Create People
    console.log("\nCreating people...");
    const people = [];
    for (const personData of data.people) {
      const person = await Person.create({
        ...personData,
        businesses: [business._id],
      });
      people.push(person);
      console.log(`✅ Created person: ${person.name} (ID: ${person._id})`);
    }

    // 3. Update Business with Executives
    console.log("\nUpdating business executives...");
    business.executives = people.map((person, index) => ({
      person: person._id,
      title: data.people[index].role,
      role: "Executive",
    }));
    await business.save();
    console.log("✅ Updated business executives");

    // 4. Create Compound
    console.log("\nCreating compound...");
    const compound = await Compound.create(data.compounds[0]);
    console.log(`✅ Created compound: ${compound.name} (ID: ${compound._id})`);

    // 5. Create Products
    console.log("\nCreating products...");
    const products = [];
    for (const productData of data.products) {
      const product = await Product.create({
        ...productData,
        business: business._id,
        compounds: [compound._id],
      });
      products.push(product);
      console.log(`✅ Created product: ${product.name} (ID: ${product._id})`);
    }

    // 6. Create Case Studies
    console.log("\nCreating case studies...");
    for (const caseStudyData of data.caseStudies) {
      const caseStudy = await CaseStudy.create({
        ...caseStudyData,
        compounds: [compound._id],
      });
      console.log(
        `✅ Created case study: ${caseStudy.title.substring(0, 50)}... (ID: ${
          caseStudy._id
        })`
      );
    }

    console.log("\n🎉 All data ingested successfully!");
    console.log("\nSummary:");
    console.log(`- 1 Business: ${business.name}`);
    console.log(
      `- ${people.length} People: ${people.map((p) => p.name).join(", ")}`
    );
    console.log(
      `- ${products.length} Products: ${products.map((p) => p.name).join(", ")}`
    );
    console.log(`- 1 Compound: ${compound.name}`);
    console.log(`- ${data.caseStudies.length} Case Studies`);
  } catch (error) {
    console.error("❌ Error during ingestion:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the ingestion
ingestEng3Data()
  .then(() => {
    console.log("Ingestion complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Ingestion failed:", error);
    process.exit(1);
  });
```

Then run:

```bash
npx tsx scripts/oneoffs/ingestEng3Data.ts
```

## Data Quality Notes

### High-Quality Sources

- Official company website (eng3corp.com)
- Peer-reviewed journal (International Journal of Molecular Sciences)
- PubMed database
- Direct company profiles and professional bios

### Verification Status

- ✅ Business information: Verified from official website
- ✅ Personnel bios: Verified from company about page
- ✅ Product specifications: Verified from product pages
- ✅ Case studies: Verified from PubMed and official sources
- ✅ Media links: All tested and working

### Data Completeness

- **Complete:** Business, People, Products
- **Complete:** Primary compound (Structured Water)
- **Complete:** 5 major case studies with citations
- **Additional research available:** More case studies and articles exist on the website

## Suggested Follow-Up Research

1. **Additional Podcast Episodes:** Search The Human Upgrade episode database for the specific episode with Rowena Gates
2. **More Case Studies:** The website has additional articles and studies that could be ingested
3. **International Distributors:** Contact information available for global presence
4. **User Testimonials:** Multiple endorsements from athletes and practitioners
5. **Related Technologies:** Research on cryotherapy + NanoVi, HBOT + NanoVi combinations

## Important Relationships

### Business ↔ People

- Eng3 Corporation has 2 executives (Hans Eng, Rowena Gates)
- Both marked as founders/co-founders

### Business ↔ Products

- Eng3 Corporation produces 3 NanoVi models (Eco, Pro, Exo)

### Products ↔ Compounds

- All 3 products utilize Structured Water as their mechanism

### Compounds ↔ Case Studies

- Structured Water is referenced in all 5 case studies

### Potential Episode Link

- When you find the Dave Asprey episode with Rowena Gates discussing NanoVi, link it as a sponsor episode for Eng3 Corporation

## GraphQL Query Examples

### Fetch Complete Business with Relations

```graphql
query GetEng3Corporation {
  # Search for business (you'll need to implement search or use listing)
  # Then query by ID
}
```

### Fetch All NanoVi Products

```graphql
query GetNanoViProducts {
  products(limit: 100) {
    id
    name
    business {
      name
    }
    compounds {
      name
      aliases
    }
  }
}
```

### Fetch Case Studies Related to Structured Water

```graphql
query GetStructuredWaterStudies {
  compounds {
    id
    name
    caseStudies {
      title
      summary
      sourceType
      url
    }
  }
}
```

## Notes

- All timestamps in case studies are approximate based on article publication dates
- Media links have been categorized by type (website, social, podcast, research, etc.)
- The compound "Structured Water" is the scientific mechanism; you might want to add related compounds like specific proteins studied (alkaline phosphatase, peroxidase, catalase)
- Consider creating separate compound entries for specific bioactive mechanisms if needed
- The VO2 max study could also be linked to mitochondrial function compounds if you have those in your system

## Data Maintenance

- **Last Updated:** December 2, 2025
- **Source URLs:** All verified as of research date
- **Recommended Re-scrape:** Every 6 months for updated product info
- **Watch For:** New NanoVi models, additional research publications, new case studies

---

**Questions or Issues?**  
Refer to the full research document `eng3-nanovi-research.md` for detailed context and additional information not included in the JSON structure.
