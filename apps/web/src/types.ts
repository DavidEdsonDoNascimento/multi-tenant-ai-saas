export type Role = "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export type ProductInput = Omit<Product, "id">;

export type SortOption = "newest" | "name_asc" | "price_asc" | "price_desc";

export interface ProductFilters {
  search: string;
  category: string;
  sort: SortOption;
}

export interface ToolCallSummary {
  name: string;
  arguments: Record<string, unknown>;
  resultCount: number | null;
}
