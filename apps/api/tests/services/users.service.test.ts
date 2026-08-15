import { UsersService } from '../../src/modules/users/users.service.js';
import { UsersModel } from '../../src/modules/users/users.model.js';
import { AppError } from '../../src/common/middleware/error.middleware.js';

describe('UsersService - Unit Tests', () => {
  let usersService: UsersService;
  let mockModel: jest.Mocked<UsersModel>;

  beforeEach(() => {
    mockModel = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      deleteById: jest.fn(),
    } as any;

    usersService = new UsersService(mockModel);
  });

  describe('getAllUsers()', () => {
    it('returns all users from the model', async () => {
      const mockUsers = [
        { id: 1, name: 'Alice', email: 'alice@example.com', created_at: new Date() },
        { id: 2, name: 'Bob', email: 'bob@example.com', created_at: new Date() },
      ];
      mockModel.findAll.mockResolvedValueOnce(mockUsers);

      const result = await usersService.getAllUsers();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('getUserById()', () => {
    it('returns user when found', async () => {
      const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', created_at: new Date() };
      mockModel.findById.mockResolvedValueOnce(mockUser);

      const user = await usersService.getUserById(1);
      expect(user.id).toBe(1);
      expect(user.email).toBe('alice@example.com');
    });

    it('throws 404 AppError when user not found', async () => {
      mockModel.findById.mockResolvedValueOnce(null);

      await expect(usersService.getUserById(999)).rejects.toThrow(AppError);
      await expect(usersService.getUserById(999)).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('createUser()', () => {
    it('creates a new user when email is not taken', async () => {
      mockModel.findByEmail.mockResolvedValueOnce(null);
      mockModel.create.mockResolvedValueOnce({
        id: 3,
        name: 'Charlie',
        email: 'charlie@example.com',
        created_at: new Date(),
      });

      const user = await usersService.createUser({ name: 'Charlie', email: 'charlie@example.com' });
      expect(user.name).toBe('Charlie');
      expect(mockModel.create).toHaveBeenCalledWith('Charlie', 'charlie@example.com');
    });

    it('throws 409 Conflict when email already exists', async () => {
      mockModel.findByEmail.mockResolvedValueOnce({
        id: 1,
        name: 'Existing',
        email: 'duplicate@example.com',
        created_at: new Date(),
      });

      await expect(
        usersService.createUser({ name: 'New Guy', email: 'duplicate@example.com' })
      ).rejects.toThrow('already exists');
    });
  });

  describe('deleteUser()', () => {
    it('deletes user when found', async () => {
      mockModel.deleteById.mockResolvedValueOnce(true);

      const res = await usersService.deleteUser(1);
      expect(res.success).toBe(true);
      expect(res.message).toContain('deleted successfully');
    });

    it('throws 404 when user does not exist', async () => {
      mockModel.deleteById.mockResolvedValueOnce(false);

      await expect(usersService.deleteUser(999)).rejects.toThrow('not found');
    });
  });
});
