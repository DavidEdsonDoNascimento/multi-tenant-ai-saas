import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .pipe(z.url("URL inválida"))
  .refine((v) => /^https?:\/\//i.test(v), "A URL deve usar http ou https");

const productFields = {
  name: z.string().trim().min(2, "Informe o nome").max(120),
  description: z.string().trim().min(1, "Informe a descrição").max(2000),
  price: z.number("Preço inválido").min(0, "O preço não pode ser negativo").max(10_000_000),
  category: z.string().trim().min(1, "Informe a categoria").max(60),
  // Aceita "" (campo vazio no formulário) e normaliza para ausente.
  imageUrl: z.union([httpUrl, z.literal("")]).optional().transform((v) => v || undefined),
};

// Sem companyId: o tenant vem sempre do contexto autenticado.
export const createProductSchema = z.object(productFields);
export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo para atualizar");

export const productIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID inválido"),
});

export const SORT_OPTIONS = ["newest", "name_asc", "price_asc", "price_desc"] as const;

const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => v || undefined);
const optionalPrice = z.coerce.number().min(0).nullish().transform((v) => v ?? undefined);

/** Filtros compartilhados entre GET /products e a tool search_products. */
export const productFilterSchema = z.object({
  search: optionalText(100),
  category: optionalText(60),
  minPrice: optionalPrice,
  maxPrice: optionalPrice,
  sort: z.enum(SORT_OPTIONS).nullish().transform((v) => v ?? "newest"),
  limit: z.coerce.number().int().min(1).max(100).nullish().transform((v) => v ?? 50),
});

export type ProductFilters = z.infer<typeof productFilterSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
