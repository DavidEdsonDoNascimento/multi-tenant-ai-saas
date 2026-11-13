import { Router } from "express";
import type { Env } from "../../config/env.js";
import { validate } from "../../middleware/validate.js";
import { getTenant } from "../../shared/tenant.js";
import { authenticate } from "../auth/auth.middleware.js";
import { chatRequestSchema } from "./chat.schemas.js";
import { createChatService, createOpenAiClient, type LlmClient } from "./chat.service.js";

export function chatRoutes(env: Env, llm: LlmClient | null = createOpenAiClient(env)): Router {
  const router = Router();
  const service = createChatService(llm, env.OPENAI_MODEL);

  router.post("/", authenticate(env), validate("body", chatRequestSchema), async (req, res) => {
    res.json(await service.reply(getTenant(req), req.body));
  });

  return router;
}
