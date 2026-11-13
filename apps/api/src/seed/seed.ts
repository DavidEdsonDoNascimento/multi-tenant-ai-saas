import bcrypt from "bcryptjs";
import { Company } from "../modules/companies/company.model.js";
import { Product } from "../modules/products/product.model.js";
import { User } from "../modules/users/user.model.js";
import { DEMO_PASSWORD, SEED_COMPANIES } from "./data.js";

const slug = (s: string) => s.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();

/**
 * Idempotente: empresas são localizadas pelo nome, usuários pelo e-mail e
 * produtos por (empresa, nome). Rodar várias vezes não duplica registros.
 */
export async function seedDatabase() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const def of SEED_COMPANIES) {
    const company = await Company.findOneAndUpdate(
      { name: def.name },
      { $setOnInsert: { name: def.name } },
      { upsert: true, returnDocument: "after" },
    );

    for (const [role, u] of [["admin", def.admin], ["user", def.user]] as const) {
      await User.updateOne(
        { email: u.email },
        { $set: { name: u.name, role, companyId: company._id }, $setOnInsert: { email: u.email, passwordHash } },
        { upsert: true },
      );
    }

    for (const p of def.products) {
      await Product.updateOne(
        { companyId: company._id, name: p.name },
        { $set: { ...p, imageUrl: `https://picsum.photos/seed/${slug(def.name)}-${slug(p.name)}/600/400` } },
        { upsert: true },
      );
    }
  }
}
