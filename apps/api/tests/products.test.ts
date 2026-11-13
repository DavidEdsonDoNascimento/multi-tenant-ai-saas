import request from "supertest";
import { describe, expect, it } from "vitest";
import { Product } from "../src/modules/products/product.model.js";
import { auth, createTenant, insertProduct, makeApp } from "./helpers.js";

const app = makeApp();
const newProduct = { name: "Cadeira", description: "Cadeira ergonômica", price: 799.9, category: "Móveis", imageUrl: "https://example.com/a.png" };

async function twoTenants() {
  const a = await createTenant(app, "a");
  const b = await createTenant(app, "b");
  const pa = await insertProduct(a.companyId, { name: "Produto da A", category: "CatA", price: 10 });
  const pb = await insertProduct(b.companyId, { name: "Produto da B", category: "CatB", price: 20 });
  return { a, b, pa, pb };
}

describe("isolamento entre empresas", () => {
  it("lista apenas produtos da própria empresa", async () => {
    const { a, b } = await twoTenants();
    const ra = await request(app).get("/products").set(auth(a.admin.token)).expect(200);
    const rb = await request(app).get("/products").set(auth(b.user.token)).expect(200);

    expect(ra.body.items.map((p: { name: string }) => p.name)).toEqual(["Produto da A"]);
    expect(rb.body.items.map((p: { name: string }) => p.name)).toEqual(["Produto da B"]);
  });

  it("nega leitura de produto de outro tenant mesmo conhecendo o ID", async () => {
    const { a, pb } = await twoTenants();
    await request(app).get(`/products/${pb.id}`).set(auth(a.admin.token)).expect(404);
    await request(app).get(`/products/${pb.id}`).set(auth(a.user.token)).expect(404);
  });

  it("nega edição e exclusão de produto de outro tenant, sem alterá-lo", async () => {
    const { a, pb } = await twoTenants();
    await request(app).patch(`/products/${pb.id}`).set(auth(a.admin.token)).send({ name: "Invadido" }).expect(404);
    await request(app).delete(`/products/${pb.id}`).set(auth(a.admin.token)).expect(404);

    const stored = await Product.findById(pb.id);
    expect(stored?.name).toBe("Produto da B");
  });

  it("filtros e categorias também respeitam o tenant", async () => {
    const { a } = await twoTenants();
    const byCat = await request(app).get("/products?category=CatB").set(auth(a.admin.token)).expect(200);
    expect(byCat.body.items).toHaveLength(0);
    const search = await request(app).get("/products?search=Produto").set(auth(a.admin.token)).expect(200);
    expect(search.body.items).toHaveLength(1);
    const cats = await request(app).get("/products/categories").set(auth(a.admin.token)).expect(200);
    expect(cats.body.items).toEqual(["CatA"]);
  });

  it("cria sempre no tenant autenticado, ignorando companyId do corpo", async () => {
    const { a, b } = await twoTenants();
    const res = await request(app)
      .post("/products")
      .set(auth(a.admin.token))
      .send({ ...newProduct, companyId: b.companyId })
      .expect(201);

    const stored = await Product.findById(res.body.id);
    expect(stored?.companyId.toString()).toBe(a.companyId);
    expect(res.body.companyId).toBeUndefined();
  });

  it("não permite mover um produto para outro tenant via PATCH", async () => {
    const { a, b, pa } = await twoTenants();
    await request(app).patch(`/products/${pa.id}`).set(auth(a.admin.token)).send({ name: "Renomeado", companyId: b.companyId }).expect(200);
    const stored = await Product.findById(pa.id);
    expect(stored?.name).toBe("Renomeado");
    expect(stored?.companyId.toString()).toBe(a.companyId);
  });
});

describe("autorização por role", () => {
  it("admin cria, edita e exclui", async () => {
    const { a } = await twoTenants();
    const created = await request(app).post("/products").set(auth(a.admin.token)).send(newProduct).expect(201);
    expect(created.body).toMatchObject({ name: "Cadeira", price: 799.9, category: "Móveis" });

    const updated = await request(app).patch(`/products/${created.body.id}`).set(auth(a.admin.token)).send({ price: 699 }).expect(200);
    expect(updated.body.price).toBe(699);
    expect(updated.body.name).toBe("Cadeira");

    await request(app).delete(`/products/${created.body.id}`).set(auth(a.admin.token)).expect(204);
    await request(app).get(`/products/${created.body.id}`).set(auth(a.admin.token)).expect(404);
  });

  it("user só visualiza: criar, editar e excluir retornam 403", async () => {
    const { a, pa } = await twoTenants();
    await request(app).get("/products").set(auth(a.user.token)).expect(200);
    await request(app).get(`/products/${pa.id}`).set(auth(a.user.token)).expect(200);

    await request(app).post("/products").set(auth(a.user.token)).send(newProduct).expect(403);
    await request(app).patch(`/products/${pa.id}`).set(auth(a.user.token)).send({ name: "x" }).expect(403);
    await request(app).delete(`/products/${pa.id}`).set(auth(a.user.token)).expect(403);

    const stored = await Product.findById(pa.id);
    expect(stored?.name).toBe("Produto da A");
    expect(await Product.countDocuments({ companyId: a.companyId })).toBe(1);
  });
});

describe("validação e filtros", () => {
  it("rejeita dados inválidos com erro padronizado", async () => {
    const { a } = await twoTenants();
    const bad = await request(app).post("/products").set(auth(a.admin.token)).send({ ...newProduct, price: -5, imageUrl: "javascript:alert(1)" }).expect(400);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");
    expect(bad.body.error.details.map((d: { path: string }) => d.path)).toEqual(expect.arrayContaining(["price", "imageUrl"]));

    await request(app).get("/products/nao-e-um-id").set(auth(a.admin.token)).expect(400);
    await request(app).patch("/products/507f1f77bcf86cd799439011").set(auth(a.admin.token)).send({}).expect(400);
  });

  it("não interpreta operadores Mongo vindos da query string (NoSQL injection)", async () => {
    const { a } = await twoTenants();
    await insertProduct(a.companyId, { name: "Outro da A" });
    // Se `search[$ne]` virasse operador, "Produto da A" seria excluído; é apenas um parâmetro desconhecido.
    const res = await request(app).get("/products?search[$ne]=Produto da A").set(auth(a.admin.token)).expect(200);
    expect(res.body.items).toHaveLength(2);
    await request(app).get("/products?minPrice[$gt]=0&limit=abc").set(auth(a.admin.token)).expect(400);
  });

  it("filtra por termo, categoria e faixa de preço e ordena", async () => {
    const a = await createTenant(app, "a");
    await insertProduct(a.companyId, { name: "Mouse Gamer", category: "Periféricos", price: 150 });
    await insertProduct(a.companyId, { name: "Teclado Gamer", category: "Periféricos", price: 300 });
    await insertProduct(a.companyId, { name: "Monitor", category: "Monitores", price: 1000 });
    const get = async (qs: string) =>
      (await request(app).get(`/products?${qs}`).set(auth(a.admin.token)).expect(200)).body.items.map((p: { name: string }) => p.name);

    expect(await get("search=gamer&sort=price_desc")).toEqual(["Teclado Gamer", "Mouse Gamer"]);
    expect(await get("category=periféricos&sort=name_asc")).toEqual(["Mouse Gamer", "Teclado Gamer"]);
    expect(await get("minPrice=200&maxPrice=500")).toEqual(["Teclado Gamer"]);
    expect(await get("limit=1&sort=price_asc")).toEqual(["Mouse Gamer"]);
    expect(await get("search=.*")).toEqual([]); // regex é escapado
  });
});
