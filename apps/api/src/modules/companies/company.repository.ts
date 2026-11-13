import { Company } from "./company.model.js";

export const companyRepository = {
  create: (name: string) => Company.create({ name }),
  findById: (id: string) => Company.findById(id),
  deleteById: (id: string) => Company.deleteOne({ _id: id }),
};
