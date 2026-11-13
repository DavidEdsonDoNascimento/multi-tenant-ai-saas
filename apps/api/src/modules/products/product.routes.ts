import { Router } from "express";
import type { Env } from "../../config/env.js";
import { requireRole } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { getTenant } from "../../shared/tenant.js";
import { authenticate } from "../auth/auth.middleware.js";
import {
  createProductSchema,
  productFilterSchema,
  productIdParamsSchema,
  type ProductFilters,
  updateProductSchema,
} from "./product.schemas.js";
import { productService } from "./product.service.js";

export function productRoutes(env: Env): Router {
  const router = Router();
  const adminOnly = requireRole("admin");

  router.use(authenticate(env));

  // Leitura: admin e user, sempre restrita à empresa do usuário autenticado.
  router.get("/", validate("query", productFilterSchema), async (req, res) => {
    res.json({ items: await productService.list(getTenant(req), req.query as unknown as ProductFilters) });
  });

  router.get("/categories", async (req, res) => {
    res.json({ items: await productService.categories(getTenant(req)) });
  });

  router.get("/:id", validate("params", productIdParamsSchema), async (req, res) => {
    res.json(await productService.get(getTenant(req), req.params.id as string));
  });

  // Escrita: somente admin.
  router.post("/", adminOnly, validate("body", createProductSchema), async (req, res) => {
    res.status(201).json(await productService.create(getTenant(req), req.body));
  });

  router.patch("/:id", adminOnly, validate("params", productIdParamsSchema), validate("body", updateProductSchema), async (req, res) => {
    res.json(await productService.update(getTenant(req), req.params.id as string, req.body));
  });

  router.delete("/:id", adminOnly, validate("params", productIdParamsSchema), async (req, res) => {
    await productService.remove(getTenant(req), req.params.id as string);
    res.status(204).end();
  });

  return router;
}
