import type { Request } from "express";
import { unauthorized } from "./errors.js";

export type Role = "admin" | "user";

/**
 * Contexto autenticado, montado exclusivamente no servidor a partir do usuário
 * persistido. Todo repository multi-tenant recebe este objeto como primeiro argumento.
 */
export interface TenantContext {
  userId: string;
  companyId: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

export function getTenant(req: Request): TenantContext {
  if (!req.tenant) throw unauthorized();
  return req.tenant;
}
