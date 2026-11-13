import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido"));
const password = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres"); // limite do bcrypt

// Sem companyId/role: o cadastro público sempre cria uma nova empresa e seu admin.
export const registerSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe a senha"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
