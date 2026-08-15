import { AdminModel } from '../../src/modules/admin/admin.model.js';
import { DatabaseService } from '../../src/core/database/database.service.js';

describe('AdminModel - Unit Tests', () => {
  let adminModel: AdminModel;
  const mockQuery = jest.fn();

  beforeAll(() => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));
    adminModel = new AdminModel();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('createAdminUser executes INSERT with correct params', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: 'sys_admin',
          password_hash: 'hashed',
          name: 'System Admin',
          email: 'sys@api21.dev',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const user = await adminModel.createAdminUser({
      username: 'sys_admin',
      password_hash: 'hashed',
      name: 'System Admin',
      email: 'sys@api21.dev',
      role: 'admin',
      is_active: true,
    });

    expect(user.username).toBe('sys_admin');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO admin_users'),
      ['sys_admin', 'hashed', 'System Admin', 'sys@api21.dev', 'admin', true]
    );
  });

  it('findAdminUserByUsername returns user or null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'found_user' }],
    });

    const user = await adminModel.findAdminUserByUsername('found_user');
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);

    mockQuery.mockResolvedValueOnce({ rows: [] });
    const notFound = await adminModel.findAdminUserByUsername('missing');
    expect(notFound).toBeNull();
  });

  it('updateAdminUser updates fields dynamically', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'updated_user', name: 'New Name' }],
    });

    const user = await adminModel.updateAdminUser(1, { name: 'New Name' });
    expect(user?.name).toBe('New Name');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE admin_users SET'),
      expect.arrayContaining(['New Name', 1])
    );
  });

  it('updateAdminUserPassword updates password hash', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const success = await adminModel.updateAdminUserPassword(1, 'new_hashed_pass');
    expect(success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE admin_users SET password_hash = $1'),
      ['new_hashed_pass', 1]
    );
  });

  it('deleteAdminUser executes DELETE and returns boolean', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const success = await adminModel.deleteAdminUser(1);
    expect(success).toBe(true);

    mockQuery.mockResolvedValueOnce({ rowCount: 0 });
    const failed = await adminModel.deleteAdminUser(999);
    expect(failed).toBe(false);
  });

  it('findSessionByToken executes SELECT and returns active session', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, token: 'tok_123', username: 'admin', is_active: true }],
    });

    const session = await adminModel.findSessionByToken('tok_123');
    expect(session?.token).toBe('tok_123');
  });

  it('deactivateSessionById sets is_active = false', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const success = await adminModel.deactivateSessionById('tok_123');
    expect(success).toBe(true);
  });
});
