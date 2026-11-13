import mongoose from "mongoose";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";

const env = loadEnv();
await connectDatabase(env.MONGODB_URI);
// Garante os índices (companyId, ...) antes de aceitar tráfego.
await mongoose.syncIndexes();

createApp(env).listen(env.PORT, () => {
  console.log(`API em http://localhost:${env.PORT}`);
  if (!env.OPENAI_API_KEY) console.warn("Aviso: OPENAI_API_KEY ausente; POST /chat retornará AI_NOT_CONFIGURED.");
});
