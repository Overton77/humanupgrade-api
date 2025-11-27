import { readFileSync } from "fs";
import path from "path";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectToDatabase } from "./db/connection";
import { env } from "./config/env";
import { resolvers } from "./graphql/resolvers";
import { getUserFromAuthHeader } from "./services/auth";

interface Context {
  user: any | null;
}

// Create and configure Apollo Server
function createApolloServer(): ApolloServer<Context> {
  // Load SDL from schema.graphql
  const schemaPath = path.join(__dirname, "graphql", "schema.graphql");
  const typeDefs = readFileSync(schemaPath, "utf8");

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    // Enable introspection and playground in all environments for development
    introspection: true,
  });

  return server;
}

// Start the server
async function startServer() {
  // Connect to database
  await connectToDatabase();

  // Create Apollo Server
  const apolloServer = createApolloServer();

  const { url } = await startStandaloneServer(apolloServer, {
    listen: { port: env.port },
    context: async ({ req }): Promise<Context> => {
      const authHeader = req.headers.authorization;
      const user = await getUserFromAuthHeader(authHeader);
      return { user };
    },
  });

  console.log(`🚀 GraphQL server ready at ${url}`);
  console.log(`🎮 Apollo Sandbox available at ${url}`);
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
