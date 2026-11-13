import { Router } from "express";
import type { Env } from "../../config/env.js";
import { validate } from "../../middleware/validate.js";
import { notFound } from "../../shared/errors.js";
import { getTenant } from "../../shared/tenant.js";
import { companyRepository } from "../companies/company.repository.js";
import { userRepository } from "../users/user.repository.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { authenticate } from "./auth.middleware.js";
import { createAuthService } from "./auth.service.js";

export function authRoutes(env: Env): Router {
  const router = Router();
  const service = createAuthService(env);

  router.post("/register", validate("body", registerSchema), async (req, res) => {
    res.status(201).json(await service.register(req.body));
  });

  router.post("/login", validate("body", loginSchema), async (req, res) => {
    res.json(await service.login(req.body));
  });

  router.get("/me", authenticate(env), async (req, res) => {
    const tenant = getTenant(req);
    const [user, company] = await Promise.all([
      userRepository.findById(tenant.userId),
      companyRepository.findById(tenant.companyId),
    ]);
    if (!user || !company) throw notFound();
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company: { id: company.id, name: company.name } },
    });
  });

  return router;
}
