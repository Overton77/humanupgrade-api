/**
 * GraphQL Mutation Tests for Labs and Studies Modules
 * 
 * Tests the createBiomarker, createLabTest, createPanelDefinition, and upsertCaseStudy mutations.
 * 
 * Usage:
 *   tsx src/scripts/tests/mutationsTests.ts
 * 
 * Prerequisites:
 *   - GraphQL server must be running on http://localhost:4000/graphql
 *   - Neo4j database must be accessible
 */

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: Array<string | number>;
    extensions?: any;
  }>;
}

async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Test Mutations
// ============================================================================

async function testCreateBiomarker() {
  console.log("\n🧪 Testing createBiomarker mutation...");

  const mutation = `
    mutation CreateBiomarker($input: BiomarkerInput!) {
      createBiomarker(input: $input) {
        biomarkerId
        name
        synonyms
        description
        clinicalDomains
        unitsCommon
        interpretationNotes
        createdAt
      }
    }
  `;

  const variables = {
    input: {
      name: "Hemoglobin A1c",
      synonyms: ["HbA1c", "Glycated Hemoglobin", "A1C"],
      description: "A form of hemoglobin that is chemically linked to a sugar",
      clinicalDomains: ["Diabetes", "Metabolic Health"],
      unitsCommon: ["%", "mmol/mol"],
      interpretationNotes: "Normal range: 4.0-5.6%. Values above 6.5% indicate diabetes.",
    },
  };

  try {
    const result = await graphqlRequest(mutation, variables);
    
    if (result.errors) {
      console.error("❌ Errors:", JSON.stringify(result.errors, null, 2));
      return null;
    }

    if (result.data?.createBiomarker) {
      console.log("✅ Successfully created biomarker:");
      console.log(JSON.stringify(result.data.createBiomarker, null, 2));
      return result.data.createBiomarker;
    }

    console.error("❌ No data returned");
    return null;
  } catch (error) {
    console.error("❌ Error creating biomarker:", error);
    return null;
  }
}

async function testCreateLabTest() {
  console.log("\n🧪 Testing createLabTest mutation...");

  const mutation = `
    mutation CreateLabTest($input: LabTestInput!) {
      createLabTest(input: $input) {
        labTestId
        name
        synonyms
        loincCodes
        cptCodes
        whatItMeasures
        prepRequirements
        createdAt
      }
    }
  `;

  const variables = {
    input: {
      name: "Complete Blood Count with Differential",
      synonyms: ["CBC with Diff", "Full Blood Count"],
      loincCodes: ["CBC-001", "58410-2"],
      cptCodes: ["85025", "85027"],
      whatItMeasures: "Measures red blood cells, white blood cells, platelets, and hemoglobin",
      prepRequirements: "No fasting required. Standard venipuncture.",
      measures: [
        {
          biomarker: {
            create: {
              name: "Hemoglobin",
              synonyms: ["Hgb", "Hb"],
              description: "Protein in red blood cells that carries oxygen",
              clinicalDomains: ["Hematology"],
              unitsCommon: ["g/dL", "g/L"],
            },
          },
          role: "primary",
        },
      ],
      requiresSpecimen: [
        {
          specimen: {
            create: {
              canonicalName: "Whole Blood - EDTA",
              specimenType: "Whole Blood",
              matrix: "Blood",
              biologicalDomain: "Hematology",
              collectionContextCategory: "Clinical Laboratory",
            },
          },
          specimenRole: "required",
          collectionSetting: "CLINIC",
          collectionMethod: "VENIPUNCTURE",
          fastingRequired: false,
          requiresAppointment: false,
          collectionTimeWindow: "ANYTIME",
        },
      ],
      usesMethod: [
        {
          measurementMethod: {
            create: {
              canonicalName: "Automated Hematology Analyzer",
              methodFamily: "Flow Cytometry",
              analyticPrinciple: "Electrical impedance and flow cytometry",
              typicalCvPercentMin: 1.0,
              typicalCvPercentMax: 3.0,
            },
          },
          methodRole: "primary",
        },
      ],
    },
  };

  try {
    const result = await graphqlRequest(mutation, variables);
    
    if (result.errors) {
      console.error("❌ Errors:", JSON.stringify(result.errors, null, 2));
      return null;
    }

    if (result.data?.createLabTest) {
      console.log("✅ Successfully created lab test:");
      console.log(JSON.stringify(result.data.createLabTest, null, 2));
      return result.data.createLabTest;
    }

    console.error("❌ No data returned");
    return null;
  } catch (error) {
    console.error("❌ Error creating lab test:", error);
    return null;
  }
}

async function testCreatePanelDefinition() {
  console.log("\n🧪 Testing createPanelDefinition mutation...");

  const mutation = `
    mutation CreatePanelDefinition($input: PanelDefinitionInput!) {
      createPanelDefinition(input: $input) {
        panelDefinitionId
        canonicalName
        aliases
        description
        createdAt
      }
    }
  `;

  const variables = {
    input: {
      canonicalName: "Comprehensive Metabolic Panel",
      aliases: ["CMP", "Metabolic Panel", "Chemistry Panel"],
      description: "A panel of 14 tests that provides important information about the current status of your kidneys, liver, electrolyte and acid/base balance, as well as blood sugar and blood proteins",
      includesLabTest: [
        {
          labTest: {
            create: {
              name: "Glucose",
              synonyms: ["Blood Sugar", "Fasting Glucose"],
              loincCodes: ["2345-7"],
              cptCodes: ["82947"],
              whatItMeasures: "Measures the amount of glucose (sugar) in the blood",
              prepRequirements: "Fasting for 8-12 hours required",
            },
          },
          required: true,
          quantity: 1,
          notes: "Core component of metabolic panel",
        },
      ],
      includesBiomarker: [
        {
          biomarker: {
            create: {
              name: "Creatinine",
              synonyms: ["Serum Creatinine"],
              description: "Waste product from muscle metabolism",
              clinicalDomains: ["Renal Function", "Kidney Health"],
              unitsCommon: ["mg/dL", "μmol/L"],
              interpretationNotes: "Elevated levels may indicate kidney dysfunction",
            },
          },
        },
      ],
    },
  };

  try {
    const result = await graphqlRequest(mutation, variables);
    
    if (result.errors) {
      console.error("❌ Errors:", JSON.stringify(result.errors, null, 2));
      return null;
    }

    if (result.data?.createPanelDefinition) {
      console.log("✅ Successfully created panel definition:");
      console.log(JSON.stringify(result.data.createPanelDefinition, null, 2));
      return result.data.createPanelDefinition;
    }

    console.error("❌ No data returned");
    return null;
  } catch (error) {
    console.error("❌ Error creating panel definition:", error);
    return null;
  }
}

async function testUpsertCaseStudy() {
  console.log("\n🧪 Testing upsertCaseStudy mutation...");

  const mutation = `
    mutation UpsertCaseStudy($input: UpsertCaseStudyInput!) {
      upsertCaseStudy(input: $input) {
        studyId
        canonicalTitle
        studyKind
        shortTitle
        designKind
        status
        phase
        sampleSize
        randomized
        blinded
        comparatorType
        keywords
        locations
        createdAt
      }
    }
  `;

  // Get current date in ISO format for validAt
  const now = new Date().toISOString();

  const variables = {
    input: {
      study: {
        internalStudyCode: "MET-T2D-2024-RCT-001",
        canonicalTitle: "Efficacy of Metformin in Type 2 Diabetes Management: A Randomized Controlled Trial",
        studyKind: "RCT",
        shortTitle: "Metformin T2D RCT",
        aliases: ["MET-T2D-2024", "Metformin Study"],
        designKind: "PARALLEL_GROUP_RCT",
        status: "COMPLETED",
        phase: "Phase 3",
        sampleSize: 500,
        randomized: true,
        blinded: "DOUBLE_BLIND",
        comparatorType: "PLACEBO",
        keywords: ["diabetes", "metformin", "glucose", "HbA1c"],
        locations: ["United States", "Canada", "Mexico"],
        validAt: now,
      },
      evaluates: [
        {
          target: {
            kind: "PRODUCT",
            createProduct: {
              create: {
                name: "Metformin Extended Release 500mg",
                productDomain: "SUPPLEMENT",
                productType: "Pharmaceutical",
                description: "Extended release formulation of metformin hydrochloride",
                brandName: "Glucophage XR",
              },
            },
          },
          role: "INTERVENTION",
          audit: {
            validAt: now,
          },
        },
      ],
      sponsoredBy: [
        {
          organization: {
            create: {
              name: "Diabetes Research Foundation",
              orgType: "NONPROFIT",
              description: "Non-profit organization dedicated to diabetes research",
            },
          },
          role: "PRIMARY",
          audit: {
            validAt: now,
          },
        },
      ],
      runBy: [
        {
          organization: {
            create: {
              name: "Clinical Trials Network",
              orgType: "COMPANY",
              description: "Contract research organization specializing in diabetes trials",
            },
          },
          role: "CRO",
          audit: {
            validAt: now,
          },
        },
      ],
      investigatedBy: [
        {
          person: {
            create: {
              canonicalName: "Dr. Sarah Johnson",
              aliases: ["Sarah J. Smith", "S. Johnson"],
            },
          },
          role: "PI",
          affiliation: "University Medical Center",
          audit: {
            validAt: now,
          },
        },
      ],
      studiesPopulations: [
        {
          population: {
            create: {
              name: "Adults with Type 2 Diabetes",
              populationKind: "HUMAN",
              species: "Homo sapiens",
              ageMin: 18,
              ageMax: 75,
              ageUnit: "years",
              sex: "ANY",
              n: 500,
              inclusionCriteria: [
                "Diagnosed with Type 2 Diabetes",
                "HbA1c between 7.0% and 10.0%",
                "Age 18-75 years",
              ],
              exclusionCriteria: [
                "Type 1 Diabetes",
                "Severe renal impairment",
                "Pregnancy",
              ],
              validAt: now,
            },
          },
          role: "TARGET",
          audit: {
            validAt: now,
          },
        },
      ],
      hasDatasets: [
        {
          dataset: {
            create: {
              name: "Primary Efficacy Dataset",
              description: "Primary endpoint data including HbA1c measurements",
              datasetKind: "ANALYTIC",
              format: "CSV",
              license: "CC-BY-4.0",
              accessLevel: "UPON_REQUEST",
              validAt: now,
            },
          },
          role: "ANALYTIC",
          accessNotes: "Available upon request to qualified researchers",
          audit: {
            validAt: now,
          },
        },
      ],
      investigatesConditions: [
        {
          condition: {
            create: {
              name: "Type 2 Diabetes Mellitus",
              aliases: ["T2DM", "Type 2 Diabetes", "Non-insulin dependent diabetes"],
              description: "A chronic metabolic disorder characterized by insulin resistance",
              icdCodes: ["E11"],
              snomedCodes: ["44054006"],
              meshTerms: ["Diabetes Mellitus, Type 2"],
            },
          },
          role: "PRIMARY",
          audit: {
            validAt: now,
          },
        },
      ],
      hasOutcomes: [
        {
          outcome: {
            create: {
              canonicalName: "Change in HbA1c from Baseline",
              displayName: "HbA1c Reduction",
              aliases: ["A1C Change", "Glycated Hemoglobin Change"],
              description: "Primary efficacy endpoint: change in HbA1c percentage points from baseline to week 24",
              outcomeCategory: "EFFICACY",
              polarityHint: "LOWER_IS_BETTER",
              domain: "METABOLIC",
              measurementType: "CONTINUOUS",
              unit: "percentage points",
              biologicalMatrix: "Blood",
              analyte: "Hemoglobin A1c",
              timeHorizon: "24 weeks",
              standardSystem: "NGSP",
              standardCode: "4548-4",
              standardLabel: "HbA1c",
              validAt: now,
            },
          },
          priority: "PRIMARY",
          role: "ENDPOINT",
          audit: {
            validAt: now,
          },
        },
      ],
    },
  };

  try {
    const result = await graphqlRequest(mutation, variables);
    
    if (result.errors) {
      console.error("❌ Errors:", JSON.stringify(result.errors, null, 2));
      return null;
    }

    if (result.data?.upsertCaseStudy) {
      console.log("✅ Successfully upserted case study:");
      console.log(JSON.stringify(result.data.upsertCaseStudy, null, 2));
      return result.data.upsertCaseStudy;
    }

    console.error("❌ No data returned");
    return null;
  } catch (error) {
    console.error("❌ Error upserting case study:", error);
    return null;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log("=".repeat(80));
  console.log("GraphQL Mutation Tests - Labs & Studies Modules");
  console.log("=".repeat(80));
  console.log(`GraphQL Endpoint: ${GRAPHQL_ENDPOINT}`);

  const results = {
    biomarker: null as any,
    labTest: null as any,
    panelDefinition: null as any,
    caseStudy: null as any,
  };

  // Test 1: Create Biomarker
  results.biomarker = await testCreateBiomarker();

  // Test 2: Create Lab Test (with nested relationships)
  results.labTest = await testCreateLabTest();

  // Test 3: Create Panel Definition (with nested relationships)
  results.panelDefinition = await testCreatePanelDefinition();

  // Test 4: Upsert Case Study (with nested relationships)
  results.caseStudy = await testUpsertCaseStudy();

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("Test Summary");
  console.log("=".repeat(80));
  console.log(`✅ createBiomarker: ${results.biomarker ? "PASSED" : "FAILED"}`);
  console.log(`✅ createLabTest: ${results.labTest ? "PASSED" : "FAILED"}`);
  console.log(`✅ createPanelDefinition: ${results.panelDefinition ? "PASSED" : "FAILED"}`);
  console.log(`✅ upsertCaseStudy: ${results.caseStudy ? "PASSED" : "FAILED"}`);
  console.log("=".repeat(80));

  const allPassed = results.biomarker && results.labTest && results.panelDefinition && results.caseStudy;
  process.exit(allPassed ? 0 : 1);
}

// Run tests when this file is executed
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { testCreateBiomarker, testCreateLabTest, testCreatePanelDefinition, testUpsertCaseStudy, graphqlRequest };
