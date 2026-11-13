import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageOpen, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { ProductForm } from "../components/ProductForm";
import { Alert, Button, Modal, Spinner, inputClass } from "../components/ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Product, ProductInput, SortOption } from "../types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Mais recentes" },
  { value: "name_asc", label: "Nome (A–Z)" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

type Editing = { mode: "create" } | { mode: "edit"; product: Product } | null;

export function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const debouncedSearch = useDebounced(search);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const filters = { search: debouncedSearch, category, sort };
  const products = useQuery({ queryKey: ["products", filters], queryFn: () => api.listProducts(filters), placeholderData: keepPreviousData });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.categories()).items });

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["products"] }), qc.invalidateQueries({ queryKey: ["categories"] })]);

  const save = useMutation({
    mutationFn: (input: ProductInput) => (editing?.mode === "edit" ? api.updateProduct(editing.product.id, input) : api.createProduct(input)),
    onSuccess: async () => {
      await refresh();
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: async () => {
      await refresh();
      setDeleting(null);
    },
    onError: (err) => setDeleteError((err as Error).message),
  });

  const items = products.data?.items ?? [];
  const hasFilters = !!(debouncedSearch || category);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? "Gerencie o catálogo da sua empresa." : "Catálogo da sua empresa (somente leitura)."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setEditing({ mode: "create" })}>
            <Plus className="size-4" aria-hidden /> Novo produto
          </Button>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_200px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input type="search" aria-label="Buscar produtos" placeholder="Buscar por nome, descrição ou categoria…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
        </div>
        <select aria-label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          <option value="">Todas as categorias</option>
          {categories.data?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className={inputClass}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {products.isPending ? (
        <Spinner label="Carregando produtos" />
      ) : products.isError ? (
        <Alert action={<Button variant="secondary" onClick={() => products.refetch()}>Tentar novamente</Button>}>
          Não foi possível carregar os produtos: {products.error.message}
        </Alert>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <PackageOpen className="mb-3 size-10 text-slate-300" aria-hidden />
          <p className="font-medium">{hasFilters ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {hasFilters ? "Ajuste a busca ou os filtros." : isAdmin ? "Cadastre o primeiro produto da sua empresa." : "O administrador ainda não cadastrou produtos."}
          </p>
          {!hasFilters && isAdmin && (
            <Button className="mt-4" onClick={() => setEditing({ mode: "create" })}>
              <Plus className="size-4" aria-hidden /> Novo produto
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500" aria-live="polite">
            {items.length} {items.length === 1 ? "produto" : "produtos"}
          </p>
          <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${products.isFetching ? "opacity-60" : ""}`}>
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                canManage={isAdmin}
                onEdit={(product) => setEditing({ mode: "edit", product })}
                onDelete={(product) => {
                  setDeleteError(undefined);
                  setDeleting(product);
                }}
              />
            ))}
          </div>
        </>
      )}

      {editing && (
        <Modal title={editing.mode === "edit" ? "Editar produto" : "Novo produto"} onClose={() => setEditing(null)}>
          <ProductForm product={editing.mode === "edit" ? editing.product : undefined} categories={categories.data ?? []} onSubmit={(input) => save.mutateAsync(input)} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <Modal title="Excluir produto" onClose={() => setDeleting(null)}>
          {deleteError && <div className="mb-4"><Alert>{deleteError}</Alert></div>}
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir <strong>{deleting.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(deleting.id)}>
              Excluir
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
