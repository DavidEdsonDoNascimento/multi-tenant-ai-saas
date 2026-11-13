import request from "supertest";
import { describe, expect, it } from "vitest";
import { Company } from "../src/modules/companies/company.model.js";
import { Product } from "../src/modules/products/product.model.js";
import { User } from "../src/modules/users/user.model.js";
import { DEMO_PASSWORD, SEED_COMPANIES } from "../src/seed/data.js";
import { seedDatabase } from "../src/seed/seed.js";
import { auth, makeApp } from "./helpers.js";

describe("seed", () => {
  it("é idempotente e popula duas empresas com ao menos 10 produtos cada", async () => {
    await seedDatabase();
    await seedDatabase();

    expect(await Company.countDocuments()).toBe(2);
    expect(await User.countDocuments()).toBe(4);
    for (const company of await Company.find()) {
      expect(await Product.countDocuments({ companyId: company._id })).toBeGreaterThanOrEqual(10);
    }
  });

  it("permite login com as credenciais documentadas e mantém os catálogos distintos", async () => {
    await seedDatabase();
    const app = makeApp();
    const names: string[][] = [];

    for (const c of SEED_COMPANIES) {
      const login = await request(app).post("/auth/login").send({ email: c.admin.email, password: DEMO_PASSWORD }).expect(200);
      expect(login.body.user.company.name).toBe(c.name);
      const list = await request(app).get("/products").set(auth(login.body.token)).expect(200);
      names.push(list.body.items.map((p: { name: string }) => p.name));
    }
    expect(names[0]!.some((n) => names[1]!.includes(n))).toBe(false);
  });
});
