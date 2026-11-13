import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { connectDatabase, disconnectDatabase } from "../src/db/connect.js";

const uri = process.env.MONGODB_URI_TEST ?? "mongodb://127.0.0.1:27017/mini_saas_test";

beforeAll(async () => {
  // Proteção: a limpeza abaixo só pode atingir um banco dedicado a testes.
  if (!new URL(uri).pathname.endsWith("_test")) {
    throw new Error(`MONGODB_URI_TEST deve apontar para um banco terminado em "_test" (recebido: ${uri})`);
  }
  await connectDatabase(uri);
  await mongoose.syncIndexes();
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();
});
