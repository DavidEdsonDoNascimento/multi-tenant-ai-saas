import { Types, type QueryFilter } from "mongoose";
import type { TenantContext } from "../../shared/tenant.js";
import { Product, type ProductDoc } from "./product.model.js";
import type { CreateProductInput, ProductFilters, UpdateProductInput } from "./product.schemas.js";

/**
 * Único ponto de acesso à coleção de produtos. Todas as operações exigem um
 * TenantContext e aplicam `companyId` no filtro; não existe método sem escopo.
 */
const scope = (ctx: TenantContext) => ({ companyId: new Types.ObjectId(ctx.companyId) });
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  name_asc: { name: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
} as const;

export const productRepository = {
  async list(ctx: TenantContext, filters: ProductFilters) {
    const query: QueryFilter<ProductDoc> = { ...scope(ctx) };

    if (filters.category) {
      query.category = new RegExp(`^${escapeRegex(filters.category)}$`, "i");
    }
    if (filters.search) {
      const term = new RegExp(escapeRegex(filters.search), "i");
      query.$or = [{ name: term }, { description: term }, { category: term }];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {
        ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice }),
      };
    }

    return Product.find(query)
      .collation({ locale: "pt", strength: 2 })
      .sort(SORTS[filters.sort])
      .limit(filters.limit);
  },

  findById: (ctx: TenantContext, id: string) => Product.findOne({ _id: id, ...scope(ctx) }),

  create: (ctx: TenantContext, data: CreateProductInput) =>
    // companyId depois do spread: nada vindo de `data` pode sobrescrevê-lo.
    Product.create({ ...data, ...scope(ctx) }),

  update: (ctx: TenantContext, id: string, patch: UpdateProductInput) =>
    Product.findOneAndUpdate({ _id: id, ...scope(ctx) }, { $set: patch }, { returnDocument: "after", runValidators: true }),

  delete: (ctx: TenantContext, id: string) => Product.findOneAndDelete({ _id: id, ...scope(ctx) }),

  categories: async (ctx: TenantContext): Promise<string[]> => {
    const values = await Product.distinct("category", scope(ctx));
    return values.sort((a, b) => a.localeCompare(b, "pt"));
  },
};
