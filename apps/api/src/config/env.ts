import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/mini_saas"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter ao menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Provedor do agente de IA (ambos expõem a API Chat Completions da OpenAI).
  LLM_PROVIDER: z.enum(["groq", "openai"]).default("groq"),
  // Chaves opcionais no boot: a ausência é reportada como erro claro apenas em POST /chat.
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse({
    ...source,
    // Variável vazia (ex.: "GROQ_API_KEY=") equivale a ausente.
    GROQ_API_KEY: source.GROQ_API_KEY?.trim() || undefined,
    OPENAI_API_KEY: source.OPENAI_API_KEY?.trim() || undefined,
    LLM_PROVIDER: source.LLM_PROVIDER?.trim() || undefined,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }
  return parsed.data;
}
