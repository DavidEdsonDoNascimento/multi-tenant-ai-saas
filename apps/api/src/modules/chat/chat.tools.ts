import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";
import type { TenantContext } from "../../shared/tenant.js";
import { SORT_OPTIONS, productFilterSchema } from "../products/product.schemas.js";
import { productRepository } from "../products/product.repository.js";

export const SEARCH_PRODUCTS = "search_products";
const TOOL_MAX_RESULTS = 20;

// Nota: não há `companyId` nesta definição. O modelo não consegue informá-lo, e
// se o enviar mesmo assim o campo é descartado pelo schema (zod remove chaves
// desconhecidas) e nunca chega à consulta.
export const searchProductsTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: SEARCH_PRODUCTS,
    description:
      "Busca produtos no catálogo da empresa do usuário. Use sempre que a pergunta envolver produtos, preços, categorias ou disponibilidade. Todos os filtros são opcionais.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Termo livre pesquisado em nome, descrição e categoria." },
        category: { type: "string", description: "Nome exato da categoria." },
        minPrice: { type: "number", description: "Preço mínimo em reais (BRL)." },
        maxPrice: { type: "number", description: "Preço máximo em reais (BRL)." },
        sort: { type: "string", enum: [...SORT_OPTIONS], description: "Ordenação. Padrão: newest." },
        limit: { type: "integer", minimum: 1, maximum: TOOL_MAX_RESULTS, description: "Máximo de resultados (padrão 10)." },
      },
      additionalProperties: false,
    },
  },
};

const toolArgsSchema = productFilterSchema.extend({
  limit: z.coerce.number().int().min(1).max(TOOL_MAX_RESULTS).nullish().transform((v) => v ?? 10),
});

export interface ToolExecution {
  /** Conteúdo (JSON) devolvido ao modelo como mensagem `tool`. */
  output: string;
  /** Resumo para exibição ao usuário. */
  summary: { name: string; arguments: unknown; resultCount: number | null };
}

/**
 * Executa uma tool solicitada pelo modelo. O TenantContext é fornecido pelo
 * servidor (JWT); os argumentos do modelo só definem filtros.
 */
export async function executeTool(ctx: TenantContext, name: string, rawArguments: string): Promise<ToolExecution> {
  const fail = (message: string, args: unknown = rawArguments): ToolExecution => ({
    output: JSON.stringify({ error: message }),
    summary: { name, arguments: args, resultCount: null },
  });

  if (name !== SEARCH_PRODUCTS) return fail(`Ferramenta desconhecida: ${name}`);

  let args: unknown;
  try {
    args = rawArguments ? JSON.parse(rawArguments) : {};
  } catch {
    return fail("Argumentos não são um JSON válido");
  }

  const parsed = toolArgsSchema.safeParse(args);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), args);
  }

  const products = await productRepository.list(ctx, parsed.data);
  return {
    output: JSON.stringify({
      count: products.length,
      products: products.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        currency: "BRL",
        category: p.category,
      })),
    }),
    summary: { name, arguments: parsed.data, resultCount: products.length },
  };
}
