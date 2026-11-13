import { ImageOff, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "../lib/format";
import type { Product } from "../types";
import { Badge } from "./ui";

interface Props {
  product: Product;
  canManage: boolean;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function ProductCard({ product, canManage, onEdit, onDelete }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* O placeholder fica sempre ao fundo: aparece enquanto a imagem carrega, se ela falhar ou se o host não responder. */}
      <div className="relative flex aspect-[3/2] items-center justify-center bg-slate-100 text-slate-300">
        <ImageOff className="size-8" aria-hidden />
        {product.imageUrl && !imageFailed && (
          <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} className="absolute inset-0 size-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Badge tone="indigo">{product.category}</Badge>
        <h3 className="font-semibold leading-snug">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-slate-500">{product.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
          {canManage && (
            <div className="flex gap-1">
              <button onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => onDelete(product)} aria-label={`Excluir ${product.name}`} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
