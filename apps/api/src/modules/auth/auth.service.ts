import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Env } from "../../config/env.js";
import { conflict, unauthorized } from "../../shared/errors.js";
import { companyRepository } from "../companies/company.repository.js";
import { userRepository } from "../users/user.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const BCRYPT_ROUNDS = 10;
// Hash descartável usado para igualar o tempo de resposta quando o e-mail não existe.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", BCRYPT_ROUNDS);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  company: { id: string; name: string };
}

export function createAuthService(env: Pick<Env, "JWT_SECRET" | "JWT_EXPIRES_IN">) {
  const signToken = (userId: string) =>
    // O token carrega apenas a identidade (sub). companyId e role são
    // sempre lidos do usuário persistido no middleware de autenticação.
    jwt.sign({}, env.JWT_SECRET, {
      subject: userId,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

  return {
    signToken,

    async register(input: RegisterInput): Promise<{ token: string; user: AuthUser }> {
      if (await userRepository.findByEmail(input.email)) throw conflict("E-mail já cadastrado");

      const company = await companyRepository.create(input.companyName);
      try {
        const user = await userRepository.create({
          companyId: company.id,
          name: input.name,
          email: input.email,
          passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
          role: "admin",
        });
        return {
          token: signToken(user.id),
          user: { id: user.id, name: user.name, email: user.email, role: "admin", company: { id: company.id, name: company.name } },
        };
      } catch (err) {
        // Mongo standalone não tem transações: compensa removendo a empresa órfã.
        await companyRepository.deleteById(company.id);
        if ((err as { code?: number }).code === 11000) throw conflict("E-mail já cadastrado");
        throw err;
      }
    },

    async login(input: LoginInput): Promise<{ token: string; user: AuthUser }> {
      const user = await userRepository.findByEmail(input.email);
      const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) throw unauthorized("E-mail ou senha inválidos");

      const company = await companyRepository.findById(user.companyId.toString());
      if (!company) throw unauthorized("Empresa não encontrada");
      return {
        token: signToken(user.id),
        user: { id: user.id, name: user.name, email: user.email, role: user.role, company: { id: company.id, name: company.name } },
      };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
