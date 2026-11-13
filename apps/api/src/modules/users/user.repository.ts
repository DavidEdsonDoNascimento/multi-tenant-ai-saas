import type { Role } from "../../shared/tenant.js";
import { User } from "./user.model.js";

export interface NewUser {
  companyId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export const userRepository = {
  create: (data: NewUser) => User.create(data),
  findByEmail: (email: string) => User.findOne({ email: email.toLowerCase() }),
  findById: (id: string) => User.findById(id),
};
