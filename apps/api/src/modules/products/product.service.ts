import type { TenantContext } from "../../shared/tenant.js";
import { notFound } from "../../shared/errors.js";
import { Product } from "./product.model.js";
import { productRepository } from "./product.repository.js";
import type { CreateProductInput, ProductFilters, UpdateProductInput } from "./product.schemas.js";

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ProductDocument = InstanceType<typeof Product>;

export const toProductDto = (p: ProductDocument): ProductDto => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price,
  category: p.category,
  ...(p.imageUrl && { imageUrl: p.imageUrl }),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

// Produto inexistente e produto de outro tenant são indistinguíveis: ambos 404.
const orNotFound = (p: ProductDocument | null) => {
  if (!p) throw notFound("Produto não encontrado");
  return toProductDto(p);
};

export const productService = {
  list: async (ctx: TenantContext, filters: ProductFilters) =>
    (await productRepository.list(ctx, filters)).map(toProductDto),
  get: async (ctx: TenantContext, id: string) => orNotFound(await productRepository.findById(ctx, id)),
  create: async (ctx: TenantContext, data: CreateProductInput) => toProductDto(await productRepository.create(ctx, data)),
  update: async (ctx: TenantContext, id: string, patch: UpdateProductInput) =>
    orNotFound(await productRepository.update(ctx, id, patch)),
  remove: async (ctx: TenantContext, id: string) => {
    orNotFound(await productRepository.delete(ctx, id));
  },
  categories: (ctx: TenantContext) => productRepository.categories(ctx),
};
