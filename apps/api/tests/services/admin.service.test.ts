import bcrypt from 'bcryptjs';
import { AdminService } from '../../src/modules/admin/admin.service.js';
import { AdminModel } from '../../src/modules/admin/admin.model.js';
import { AppError } from '../../src/common/middleware/error.middleware.js';

describe('AdminService - Unit Tests', () => {
  let adminService: AdminService;
  let mockModel: jest.Mocked<AdminModel>;

  beforeEach(() => {
    mockModel = {
      findAdminUserByUsername: jest.fn(),
      findAdminUserById: jest.fn(),
      getAdminUsers: jest.fn(),
      createAdminUser: jest.fn(),
      updateAdminUser: jest.fn(),
      updateAdminUserPassword: jest.fn(),
      updateAdminUserLastLogin: jest.fn(),
      deleteAdminUser: jest.fn(),
      countAdminUsers: jest.fn(),
      countActiveAdminUsers: jest.fn(),
      findSessionByToken: jest.fn(),
      createAdminSession: jest.fn(),
      revokeSession: jest.fn(),
      getSessions: jest.fn(),
      getSessionById: jest.fn(),
      deactivateSessionById: jest.fn(),
      getDeployments: jest.fn(),
      getDeploymentLogs: jest.fn(),
      getAdminStats: jest.fn(),
    } as any;

    adminService = new AdminService(mockModel);
  });

  describe('login()', () => {
    it('authenticates active database user when bcrypt password matches', async () => {
      const hashedPassword = await bcrypt.hash('secretpassword', 10);
      mockModel.findAdminUserByUsername.mockResolvedValueOnce({
        id: 1,
        username: 'ops_lead',
        password_hash: hashedPassword,
        name: 'Ops Lead',
        email: 'ops@apps21.dev',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      mockModel.createAdminSession.mockResolvedValueOnce({
        id: 1,
        token: 'session_token_123',
        username: 'ops_lead',
        ip_address: '127.0.0.1',
        user_agent: 'JestTest',
        session_hash: 'hash',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await adminService.login('ops_lead', 'secretpassword', '127.0.0.1', 'JestTest');

      expect(result.token).toBe('session_token_123');
      expect(result.csrfToken).toBeDefined();
      expect(result.user.username).toBe('ops_lead');
      expect(result.user.role).toBe('admin');
      expect(mockModel.updateAdminUserLastLogin).toHaveBeenCalledWith(1);
    });

    it('rejects database user with wrong password with 401', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockModel.findAdminUserByUsername.mockResolvedValueOnce({
        id: 1,
        username: 'ops_lead',
        password_hash: hashedPassword,
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await expect(
        adminService.login('ops_lead', 'wrongpassword', '127.0.0.1', 'JestTest')
      ).rejects.toThrow(AppError);
    });

    it('rejects revoked / inactive database user with 401', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockModel.findAdminUserByUsername.mockResolvedValueOnce({
        id: 1,
        username: 'inactive_user',
        password_hash: hashedPassword,
        role: 'admin',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await expect(
        adminService.login('inactive_user', 'password123', '127.0.0.1', 'JestTest')
      ).rejects.toThrow('Account is deactivated');
    });

    it('falls back to master environment credentials when user is not found in database', async () => {
      mockModel.findAdminUserByUsername.mockResolvedValueOnce(null);
      mockModel.createAdminSession.mockResolvedValueOnce({
        id: 2,
        token: 'root_token_999',
        username: 'admin',
        ip_address: '127.0.0.1',
        user_agent: 'JestTest',
        session_hash: 'hash',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await adminService.login('admin', 'securepassword', '127.0.0.1', 'JestTest');

      expect(result.token).toBe('root_token_999');
      expect(result.user.username).toBe('admin');
      expect(result.user.role).toBe('superadmin');
    });
  });

  describe('createAdminUser()', () => {
    it('hashes password and creates user in database', async () => {
      mockModel.findAdminUserByUsername.mockResolvedValueOnce(null);
      mockModel.createAdminUser.mockResolvedValueOnce({
        id: 5,
        username: 'new_admin',
        name: 'New Admin',
        email: 'new@apps21.dev',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const user = await adminService.createAdminUser({
        username: 'new_admin',
        password: 'Password123!',
        name: 'New Admin',
        email: 'new@apps21.dev',
        role: 'admin',
      });

      expect(user.username).toBe('new_admin');
      expect(mockModel.createAdminUser).toHaveBeenCalled();
      const createCallArgs = mockModel.createAdminUser.mock.calls[0][0];
      expect(createCallArgs.username).toBe('new_admin');
      expect(createCallArgs.password_hash).not.toBe('Password123!'); // Hashed
    });

    it('throws 409 Conflict when username already exists', async () => {
      mockModel.findAdminUserByUsername.mockResolvedValueOnce({ id: 1 } as any);

      await expect(
        adminService.createAdminUser({ username: 'existing_user', password: 'Password123!' })
      ).rejects.toThrow('already exists');
    });
  });

  describe('updateAdminUser()', () => {
    it('updates user when found', async () => {
      mockModel.findAdminUserById.mockResolvedValueOnce({ id: 2, username: 'test' } as any);
      mockModel.updateAdminUser.mockResolvedValueOnce({
        id: 2,
        username: 'test',
        name: 'Updated Name',
        role: 'operator',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const updated = await adminService.updateAdminUser(2, { name: 'Updated Name', role: 'operator' });
      expect(updated?.name).toBe('Updated Name');
    });

    it('throws 404 when user not found', async () => {
      mockModel.findAdminUserById.mockResolvedValueOnce(null);

      await expect(
        adminService.updateAdminUser(999, { name: 'Nonexistent' })
      ).rejects.toThrow('not found');
    });
  });

  describe('resetAdminUserPassword()', () => {
    it('hashes new password and updates DB', async () => {
      mockModel.findAdminUserById.mockResolvedValueOnce({ id: 3, username: 'dev' } as any);
      mockModel.updateAdminUserPassword.mockResolvedValueOnce(true);

      const result = await adminService.resetAdminUserPassword(3, 'NewSecurePass99!');
      expect(result.success).toBe(true);
      expect(mockModel.updateAdminUserPassword).toHaveBeenCalled();
    });
  });

  describe('deleteAdminUser()', () => {
    it('deletes user successfully', async () => {
      mockModel.findAdminUserById.mockResolvedValueOnce({ id: 4, username: 'to_delete' } as any);
      mockModel.deleteAdminUser.mockResolvedValueOnce(true);

      const result = await adminService.deleteAdminUser(4);
      expect(result.success).toBe(true);
    });

    it('throws 404 when user does not exist', async () => {
      mockModel.findAdminUserById.mockResolvedValueOnce(null);

      await expect(adminService.deleteAdminUser(999)).rejects.toThrow('not found');
    });
  });

  describe('generateTerminalTicket() & validateTerminalTicket()', () => {
    it('generates and validates a single-use ticket', async () => {
      const ticketData = await adminService.generateTerminalTicket('admin_session_token');
      expect(ticketData.ticket).toBeDefined();
      expect(ticketData.expiresIn).toBe(30);

      // Verify ticket can be redeemed
      const verified = adminService.validateTerminalTicket(ticketData.ticket);
      expect(verified).toBe(true);

      // Verify single-use (second redemption fails)
      const secondAttempt = adminService.validateTerminalTicket(ticketData.ticket);
      expect(secondAttempt).toBe(false);
    });
  });

  describe('getSystemMetrics()', () => {
    it('returns host cpu, memory, disk, and process telemetry', async () => {
      const metrics = await adminService.getSystemMetrics();
      expect(metrics.cpu).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.memory.totalMB).toBeGreaterThan(0);
      expect(metrics.disk).toBeDefined();
      expect(metrics.process).toBeDefined();
    });
  });
});
