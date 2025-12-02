import { readFileSync } from "fs";
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws"; // Fixed: use/ws instead of lib/use/ws
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import cors from "cors";

import { connectToDatabase } from "./db/connection.js";
import { env } from "./config/env.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { getUserFromAuthHeader, Context, Role } from "./services/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Connect to database first
  await connectToDatabase(env.dbName);

  // Load schema
  const schemaPath = path.join(__dirname, "graphql", "schema.graphql");
  const typeDefs = readFileSync(schemaPath, "utf8");

  // Build a GraphQLSchema instance so we can reuse it for HTTP & WS
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create Express app and HTTP server
  const app = express();
  const httpServer = createServer(app);

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // Set up WebSocket server with graphql-ws
  const serverCleanup = useServer(
    {
      schema,
      // Context for subscriptions (runs on WebSocket connect/start)
      context: async (ctx): Promise<Context> => {
        const authHeader =
          (ctx.connectionParams?.authorization as string | undefined) ??
          (ctx.connectionParams?.Authorization as string | undefined);

        const user = await getUserFromAuthHeader(authHeader);
        return { user, role: (user?.role as Role) || null };
      },
    },
    wsServer
  );

  // Create Apollo Server
  const apolloServer = new ApolloServer<Context>({
    schema,
    introspection: true,
    plugins: [
      // Proper shutdown for the HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();

  // Apply Express middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }): Promise<Context> => {
        const authHeader = req.headers.authorization;
        const user = await getUserFromAuthHeader(authHeader);
        return { user, role: user?.role || null };
      },
    })
  );

  // Start the HTTP server (which also handles WebSocket upgrades)
  httpServer.listen(env.port, () => {
    console.log(
      `🚀 GraphQL server ready at http://localhost:${env.port}/graphql`
    );
    console.log(
      `🔌 WebSocket subscriptions ready at ws://localhost:${env.port}/graphql`
    );
    console.log(
      `🎮 Apollo Sandbox available at http://localhost:${env.port}/graphql`
    );
  });
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
