import type { RequestHandler } from "express";
import { forbidden } from "../shared/errors.js";
import { getTenant, type Role } from "../shared/tenant.js";

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!roles.includes(getTenant(req).role)) return next(forbidden("Permissão insuficiente"));
    next();
  };
