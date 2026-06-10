import { db } from "../config/db";

export interface IUser {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export const User = {
  tableName: "users",

  query() {
    return db<IUser>(this.tableName);
  },

  async findById(id: number): Promise<IUser | undefined> {
    return this.query().where({ id }).first();
  },

  async findByEmail(email: string): Promise<IUser | undefined> {
    return this.query().where({ email: email.toLowerCase().trim() }).first();
  },

  async create(user: Omit<IUser, "id" | "created_at" | "updated_at">): Promise<IUser> {
    const cleanUser = {
      name: user.name.trim(),
      email: user.email.toLowerCase().trim(),
    };
    const [inserted] = await this.query().insert(cleanUser).returning("*");
    return inserted;
  },

  async update(id: number, updates: Partial<Omit<IUser, "id" | "created_at" | "updated_at">>): Promise<IUser | undefined> {
    const cleanUpdates: typeof updates = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.email !== undefined) cleanUpdates.email = updates.email.toLowerCase().trim();

    const [updated] = await this.query()
      .where({ id })
      .update({ ...cleanUpdates, updated_at: new Date() })
      .returning("*");
    return updated;
  },

  async delete(id: number): Promise<boolean> {
    const deletedCount = await this.query().where({ id }).del();
    return deletedCount > 0;
  }
};
