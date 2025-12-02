import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../../src/graphql/schema.graphql",
  documents: "../../src/graphql/operations/**/*.graphql",
  generates: {
    "src/generated/index.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        avoidOptionals: true,
        preResolveTypes: true,
      },
    },
  },
};

export default config;
