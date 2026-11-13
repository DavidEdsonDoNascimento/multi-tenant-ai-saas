import mongoose from "mongoose";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";
import { resolveLlmConfig } from "./modules/chat/chat.service.js";

const env = loadEnv();
await connectDatabase(env.MONGODB_URI);
// Garante os índices (companyId, ...) antes de aceitar tráfego.
await mongoose.syncIndexes();

const llm = resolveLlmConfig(env);
createApp(env).listen(env.PORT, () => {
  console.log(`API em http://localhost:${env.PORT} (LLM: ${llm.provider} / ${llm.model})`);
  if (!llm.apiKey) console.warn(`Aviso: ${llm.apiKeyVar} ausente; POST /chat retornará AI_NOT_CONFIGURED.`);
});
