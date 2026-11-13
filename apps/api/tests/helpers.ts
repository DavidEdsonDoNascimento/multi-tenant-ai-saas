import bcrypt from "bcryptjs";
import type { Express } from "express";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import type { LlmClient } from "../src/modules/chat/chat.service.js";
import { Company } from "../src/modules/companies/company.model.js";
import { Product } from "../src/modules/products/product.model.js";
import { User } from "../src/modules/users/user.model.js";

export const testEnv = loadEnv({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-test-secret-test-secret-123",
  JWT_EXPIRES_IN: "1h",
  OPENAI_API_KEY: "sk-test-not-used",
  OPENAI_MODEL: "test-model",
});

export const makeApp = (llm?: LlmClient | null): Express =>
  createApp(testEnv, llm === undefined ? {} : { llm });

export const PASSWORD = "Senha@1234";

export interface TestTenant {
  companyId: string;
  admin: { id: string; token: string; email: string };
  user: { id: string; token: string; email: string };
}

/** Cria empresa + admin (via API de registro) + user (direto no banco) e devolve os tokens. */
export async function createTenant(app: Express, label: string): Promise<TestTenant> {
  const reg = await request(app)
    .post("/auth/register")
    .send({ companyName: `Empresa ${label}`, name: `Admin ${label}`, email: `admin-${label}@test.com`, password: PASSWORD })
    .expect(201);
  const companyId = reg.body.user.company.id as string;

  const userDoc = await User.create({
    companyId,
    name: `User ${label}`,
    email: `user-${label}@test.com`,
    passwordHash: await bcrypt.hash(PASSWORD, 4),
    role: "user",
  });
  const login = await request(app).post("/auth/login").send({ email: `user-${label}@test.com`, password: PASSWORD }).expect(200);

  return {
    companyId,
    admin: { id: reg.body.user.id, token: reg.body.token, email: `admin-${label}@test.com` },
    user: { id: userDoc.id, token: login.body.token, email: `user-${label}@test.com` },
  };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function insertProduct(companyId: string, overrides: Partial<{ name: string; description: string; price: number; category: string }> = {}) {
  return Product.create({
    companyId,
    name: "Produto",
    description: "Descrição",
    price: 100,
    category: "Geral",
    ...overrides,
  });
}

export async function countCompanies() {
  return Company.countDocuments();
}
