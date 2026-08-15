import { UsersModel } from '../../src/modules/users/users.model.js';
import { databaseService, DatabaseService } from '../../src/core/database/database.service.js';

describe('UsersModel - Unit Tests', () => {
  let usersModel: UsersModel;
  const mockQuery = jest.fn();

  beforeAll(() => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));
    usersModel = new UsersModel();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('findAll returns array of users', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Alice', email: 'alice@api21.dev' },
        { id: 2, name: 'Bob', email: 'bob@api21.dev' },
      ],
    });

    const users = await usersModel.findAll();
    expect(users).toHaveLength(2);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT id, name, email'));
  });

  it('findById returns user or null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Alice', email: 'alice@api21.dev' }],
    });

    const user = await usersModel.findById(1);
    expect(user?.name).toBe('Alice');

    mockQuery.mockResolvedValueOnce({ rows: [] });
    const nullUser = await usersModel.findById(999);
    expect(nullUser).toBeNull();
  });

  it('findByEmail returns user or null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Alice', email: 'alice@api21.dev' }],
    });

    const user = await usersModel.findByEmail('alice@api21.dev');
    expect(user?.id).toBe(1);
  });

  it('create inserts new user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 3, name: 'Charlie', email: 'charlie@api21.dev' }],
    });

    const user = await usersModel.create('Charlie', 'charlie@api21.dev');
    expect(user.name).toBe('Charlie');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['Charlie', 'charlie@api21.dev']
    );
  });

  it('deleteById deletes user and returns boolean', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const success = await usersModel.deleteById(1);
    expect(success).toBe(true);
  });
});
