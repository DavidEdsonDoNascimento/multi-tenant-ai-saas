import { Schema, model, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    imageUrl: { type: String, trim: true, maxlength: 2048 },
  },
  { timestamps: true },
);

// Toda consulta de produto filtra por companyId; os índices começam por ele.
productSchema.index({ companyId: 1, createdAt: -1 });
productSchema.index({ companyId: 1, category: 1 });
productSchema.index({ companyId: 1, name: 1 });
productSchema.index({ companyId: 1, price: 1 });

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
