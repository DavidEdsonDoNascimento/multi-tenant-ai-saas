import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../db/connect.js";
import { DEMO_PASSWORD, SEED_COMPANIES } from "./data.js";
import { seedDatabase } from "./seed.js";

const env = loadEnv();
await connectDatabase(env.MONGODB_URI);
await mongoose.syncIndexes();
await seedDatabase();
await disconnectDatabase();

console.log("Seed concluído. Credenciais de demonstração:");
for (const c of SEED_COMPANIES) {
  console.log(`  ${c.name} (${c.products.length} produtos)`);
  console.log(`    admin: ${c.admin.email} / ${DEMO_PASSWORD}`);
  console.log(`    user:  ${c.user.email} / ${DEMO_PASSWORD}`);
}
