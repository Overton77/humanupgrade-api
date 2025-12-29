import { readFileSync } from "fs";
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";

import { connectToDatabase } from "./db/connection.js";
import { GraphQLContext, createContext } from "./graphql/context.js";
import { env } from "./config/env.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { getIdentityFromAuthHeader, Role } from "./services/auth.js";
import { AppError, ErrorCode, isAppError } from "./lib/errors.js";
import { logger, logGraphQLOperation, logError } from "./lib/logger.js";
import { GraphQLFormattedError } from "graphql";
import { buildFormatError } from "./graphql/formatError.js";
import { graphqlRateLimitPlugin } from "./lib/rateLimit/graphqlRateLimitPlugin.js";
import { initRedis } from "./lib/redisClient.js";
import { graphqlRedisRateLimitPlugin } from "./lib/rateLimit/rateLimitPlugin.js";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/authRoutes.js";
import { initRedisPubSub } from "./lib/redisPubSub.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await connectToDatabase(env.dbName);
  await initRedis();
  await initRedisPubSub();

  const schemaPath = path.join(__dirname, "graphql", "schema.graphql");
  const typeDefs = readFileSync(schemaPath, "utf8");

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors<cors.CorsRequest>({
      origin: env.webOrigin,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json());

  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer(
    {
      schema,

      context: async (ctx): Promise<GraphQLContext> => {
        const requestId = randomUUID();
        const authHeader =
          (ctx.connectionParams?.authorization as string | undefined) ??
          (ctx.connectionParams?.Authorization as string | undefined);

        const identity = getIdentityFromAuthHeader(authHeader);

        const ip = ctx.extra?.request?.socket?.remoteAddress ?? "unknown";

        return createContext({
          userId: identity?.userId ?? null,
          role: (identity?.role as Role) ?? null,
          requestId,
          ip,
        });
      },
    },
    wsServer
  );

  // Create Apollo Server with error formatting
  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: true,
    formatError: buildFormatError(),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      graphqlRedisRateLimitPlugin(),
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

  app.use("/auth", authRouter);

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req, res }): Promise<GraphQLContext> => {
        const requestId = randomUUID();

        const authHeader = req.headers.authorization;
        const identity = getIdentityFromAuthHeader(authHeader);

        const ip = req.ip;

        const ctx = createContext({
          userId: identity?.userId ?? null,
          role: (identity?.role as Role) ?? null,
          ip: req.ip ?? "unknown",
          requestId,
          req,
          res,
        });

        logGraphQLOperation(
          req.body?.operationName || "anonymous",
          req.body?.operationName,
          {
            requestId,
            userId: ctx.userId ?? undefined,
            ip: ctx.ip,
            method: req.method,
            path: req.path,
          }
        );

        return ctx;
      },
    })
  );

  httpServer.listen(env.port, () => {
    logger.info(
      `🚀 GraphQL server ready at http://localhost:${env.port}/graphql`
    );
    logger.info(
      `🔌 WebSocket subscriptions ready at ws://localhost:${env.port}/graphql`
    );
    logger.info(
      `🎮 Apollo Sandbox available at http://localhost:${env.port}/graphql`
    );
  });
}

startServer().catch((err) => {
  logError(err, { stage: "server_startup" });
  process.exit(1);
});
