import { Router } from "express";
import type { Env } from "../../config/env.js";
import { validate } from "../../middleware/validate.js";
import { getTenant } from "../../shared/tenant.js";
import { authenticate } from "../auth/auth.middleware.js";
import { chatRequestSchema } from "./chat.schemas.js";
import { createChatService, createLlmClient, resolveLlmConfig, type LlmClient } from "./chat.service.js";

export function chatRoutes(env: Env, llm?: LlmClient | null): Router {
  const router = Router();
  const config = resolveLlmConfig(env);
  // `llm` explícito é usado nos testes; caso contrário, cliente real do provedor configurado.
  const service = createChatService(llm === undefined ? createLlmClient(config) : llm, config);

  router.post("/", authenticate(env), validate("body", chatRequestSchema), async (req, res) => {
    res.json(await service.reply(getTenant(req), req.body));
  });

  return router;
}
