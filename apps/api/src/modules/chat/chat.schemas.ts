import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Digite uma mensagem").max(2000),
  // Contexto opcional de turnos anteriores (o servidor não persiste conversas).
  // Só roles user/assistant são aceitas; nunca system/tool.
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(10)
    .optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
