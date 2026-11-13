import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Company } from "../src/modules/companies/company.model.js";
import { User } from "../src/modules/users/user.model.js";
import { PASSWORD, auth, createTenant, makeApp, testEnv } from "./helpers.js";

const app = makeApp();
const validBody = { companyName: "Acme", name: "Alice", email: "alice@acme.com", password: PASSWORD };

describe("registro", () => {
  it("cria uma nova empresa e seu administrador inicial", async () => {
    const res = await request(app).post("/auth/register").send(validBody).expect(201);

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "alice@acme.com", role: "admin", company: { name: "Acme" } });
    expect(await Company.countDocuments()).toBe(1);
  });

  it("armazena a senha com hash (bcrypt)", async () => {
    await request(app).post("/auth/register").send(validBody).expect(201);
    const user = await User.findOne({ email: "alice@acme.com" });
    expect(user?.passwordHash).not.toBe(PASSWORD);
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("ignora companyId e role enviados pelo cliente", async () => {
    const victim = await createTenant(app, "vitima");
    const res = await request(app)
      .post("/auth/register")
      .send({ ...validBody, companyId: victim.companyId, role: "admin" })
      .expect(201);

    expect(res.body.user.company.id).not.toBe(victim.companyId);
    expect(await User.countDocuments({ companyId: victim.companyId })).toBe(2); // admin + user originais
  });

  it("rejeita e-mail duplicado sem deixar empresa órfã", async () => {
    await request(app).post("/auth/register").send(validBody).expect(201);
    await request(app).post("/auth/register").send({ ...validBody, companyName: "Outra" }).expect(409);
    expect(await Company.countDocuments()).toBe(1);
  });

  it("valida os campos", async () => {
    const res = await request(app).post("/auth/register").send({ ...validBody, email: "x", password: "123" }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("login e autenticação", () => {
  it("autentica com credenciais corretas", async () => {
    await request(app).post("/auth/register").send(validBody);
    const res = await request(app).post("/auth/login").send({ email: "ALICE@acme.com", password: PASSWORD }).expect(200);
    expect(res.body.user.role).toBe("admin");

    const me = await request(app).get("/auth/me").set(auth(res.body.token)).expect(200);
    expect(me.body.user.company.name).toBe("Acme");
  });

  it("rejeita senha errada e e-mail inexistente com a mesma mensagem", async () => {
    await request(app).post("/auth/register").send(validBody);
    const wrong = await request(app).post("/auth/login").send({ email: "alice@acme.com", password: "errada-123" }).expect(401);
    const unknown = await request(app).post("/auth/login").send({ email: "nobody@acme.com", password: PASSWORD }).expect(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it("exige token válido nas rotas protegidas", async () => {
    await request(app).get("/products").expect(401);
    await request(app).get("/products").set(auth("lixo")).expect(401);

    const expired = jwt.sign({}, testEnv.JWT_SECRET, { subject: "507f1f77bcf86cd799439011", expiresIn: -10 });
    await request(app).get("/products").set(auth(expired)).expect(401);

    const wrongSecret = jwt.sign({}, "outro-segredo-outro-segredo-outro-123", { subject: "507f1f77bcf86cd799439011" });
    await request(app).get("/products").set(auth(wrongSecret)).expect(401);
  });

  it("revoga acesso quando o usuário deixa de existir", async () => {
    const t = await createTenant(app, "x");
    await User.deleteOne({ _id: t.user.id });
    await request(app).get("/products").set(auth(t.user.token)).expect(401);
  });

  it("não confia em companyId/role dentro do token", async () => {
    const a = await createTenant(app, "a");
    const b = await createTenant(app, "b");
    // Token assinado corretamente para o user de A, mas com claims forjadas de B/admin.
    const forged = jwt.sign({ companyId: b.companyId, role: "admin" }, testEnv.JWT_SECRET, { subject: a.user.id });
    await request(app).post("/products").set(auth(forged)).send({ name: "Hack", description: "x", price: 1, category: "x" }).expect(403);
  });
});
