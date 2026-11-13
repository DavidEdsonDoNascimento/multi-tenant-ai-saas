import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import type { LlmClient } from "./modules/chat/chat.service.js";
import { productRoutes } from "./modules/products/product.routes.js";

export function createApp(env: Env, deps: { llm?: LlmClient | null } = {}): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json({ limit: "50kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/auth", authRoutes(env));
  app.use("/products", productRoutes(env));
  // `llm` ausente => cliente OpenAI real (ou null sem OPENAI_API_KEY => erro de configuração).
  app.use("/chat", "llm" in deps ? chatRoutes(env, deps.llm) : chatRoutes(env));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
