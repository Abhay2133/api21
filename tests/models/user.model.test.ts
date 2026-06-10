import { mock, describe, expect, test, beforeEach } from "bun:test";

const queryBuilder: any = {};
queryBuilder.where = mock(() => queryBuilder);
queryBuilder.first = mock();
queryBuilder.insert = mock(() => queryBuilder);
queryBuilder.returning = mock();
queryBuilder.update = mock(() => queryBuilder);
queryBuilder.del = mock();

const mockDb = mock(() => queryBuilder);

mock.module("../../src/config/db", () => ({
  db: mockDb,
}));

import { User } from "../../src/models/user.model";

describe("user.model", () => {
  beforeEach(() => {
    mockDb.mockClear();
    queryBuilder.where.mockClear();
    queryBuilder.first.mockClear();
    queryBuilder.insert.mockClear();
    queryBuilder.returning.mockClear();
    queryBuilder.update.mockClear();
    queryBuilder.del.mockClear();
  });

  describe("findById", () => {
    test("should construct correct query and return user", async () => {
      const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
      queryBuilder.first.mockResolvedValue(mockUser);

      const result = await User.findById(1);

      expect(mockDb).toHaveBeenCalledWith("users");
      expect(queryBuilder.where).toHaveBeenCalledWith({ id: 1 });
      expect(queryBuilder.first).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe("findByEmail", () => {
    test("should lowercase, trim email and query", async () => {
      const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
      queryBuilder.first.mockResolvedValue(mockUser);

      const result = await User.findByEmail("  JOHN@example.COM  ");

      expect(mockDb).toHaveBeenCalledWith("users");
      expect(queryBuilder.where).toHaveBeenCalledWith({ email: "john@example.com" });
      expect(result).toEqual(mockUser);
    });
  });

  describe("create", () => {
    test("should trim name and email, lower case email, insert and return new user", async () => {
      const mockUser = { id: 1, name: "Alice", email: "alice@example.com" };
      queryBuilder.returning.mockResolvedValue([mockUser]);

      const result = await User.create({
        name: "   Alice   ",
        email: "   ALICE@EXAMPLE.COM   ",
      });

      expect(mockDb).toHaveBeenCalledWith("users");
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
      });
      expect(queryBuilder.returning).toHaveBeenCalledWith("*");
      expect(result).toEqual(mockUser);
    });
  });

  describe("update", () => {
    test("should clean updates, apply update query and return updated user", async () => {
      const mockUser = { id: 2, name: "Bob", email: "bob@example.com" };
      queryBuilder.returning.mockResolvedValue([mockUser]);

      const result = await User.update(2, {
        name: "  Bob  ",
        email: "  BOB@EXAMPLE.COM  ",
      });

      expect(mockDb).toHaveBeenCalledWith("users");
      expect(queryBuilder.where).toHaveBeenCalledWith({ id: 2 });
      expect(queryBuilder.update).toHaveBeenCalledWith({
        name: "Bob",
        email: "bob@example.com",
        updated_at: expect.any(Date),
      });
      expect(queryBuilder.returning).toHaveBeenCalledWith("*");
      expect(result).toEqual(mockUser);
    });
  });

  describe("delete", () => {
    test("should delete user and return true if count > 0", async () => {
      queryBuilder.del.mockResolvedValue(1);

      const result = await User.delete(3);

      expect(mockDb).toHaveBeenCalledWith("users");
      expect(queryBuilder.where).toHaveBeenCalledWith({ id: 3 });
      expect(queryBuilder.del).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("should return false if delete count is 0", async () => {
      queryBuilder.del.mockResolvedValue(0);

      const result = await User.delete(4);

      expect(result).toBe(false);
    });
  });
});
