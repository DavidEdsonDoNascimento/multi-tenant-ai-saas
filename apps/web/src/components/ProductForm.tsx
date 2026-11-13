import { useState, type FormEvent } from "react";
import { ApiError } from "../lib/api";
import type { Product, ProductInput } from "../types";
import { Alert, Button, Field, TextInput, inputClass } from "./ui";

interface Props {
  product?: Product;
  categories: string[];
  onSubmit: (input: ProductInput) => Promise<unknown>;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    category: product?.category ?? "",
    imageUrl: product?.imageUrl ?? "",
  });
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setFields({});
    setSaving(true);
    try {
      await onSubmit({ ...form, price: Number(form.price) });
    } catch (err) {
      if (err instanceof ApiError) setFields(err.fields);
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <TextInput label="Nome" required maxLength={120} value={form.name} onChange={set("name")} error={fields.name} />
      <Field label="Descrição" error={fields.description}>
        <textarea required rows={3} maxLength={2000} value={form.description} onChange={set("description")} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Preço (R$)" type="number" required min={0} step="0.01" value={form.price} onChange={set("price")} error={fields.price} />
        <Field label="Categoria" error={fields.category}>
          <input required list="category-options" maxLength={60} value={form.category} onChange={set("category")} className={inputClass} />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
      <TextInput label="URL da imagem (opcional)" type="url" placeholder="https://…" value={form.imageUrl} onChange={set("imageUrl")} error={fields.imageUrl} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {product ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}
