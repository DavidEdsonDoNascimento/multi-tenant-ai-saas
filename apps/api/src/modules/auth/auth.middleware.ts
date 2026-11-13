import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Env } from "../../config/env.js";
import { unauthorized } from "../../shared/errors.js";
import { userRepository } from "../users/user.repository.js";

/**
 * Estabelece o contexto do tenant (`req.tenant`). Valida o JWT e recarrega o
 * usuário no banco: companyId e role vêm do registro persistido, nunca do
 * cliente, e usuários removidos perdem acesso imediatamente.
 */
export const authenticate =
  (env: Pick<Env, "JWT_SECRET">): RequestHandler =>
  async (req, _res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) return next(unauthorized("Token ausente"));

    let userId: string;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
      if (typeof payload === "string" || !payload.sub) throw new Error("payload inválido");
      userId = payload.sub;
    } catch {
      return next(unauthorized("Token inválido ou expirado"));
    }

    const user = await userRepository.findById(userId).catch(() => null);
    if (!user) return next(unauthorized("Usuário não encontrado"));

    req.tenant = { userId: user.id, companyId: user.companyId.toString(), role: user.role };
    next();
  };
