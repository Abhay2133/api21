import { SessionsService } from '../../src/modules/sessions/sessions.service.js';
import { SessionsModel } from '../../src/modules/sessions/sessions.model.js';
import { AppError } from '../../src/common/middleware/error.middleware.js';

describe('SessionsService - Unit Tests', () => {
  let sessionsService: SessionsService;
  let mockModel: jest.Mocked<SessionsModel>;

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      findActive: jest.fn(),
      revokeByToken: jest.fn(),
      revokeById: jest.fn(),
    } as any;

    sessionsService = new SessionsService(mockModel);
  });

  describe('createSession()', () => {
    it('generates cryptographic tokens and stores session', async () => {
      mockModel.create.mockResolvedValueOnce({
        id: 1,
        token: 'mock_token',
        username: 'alice',
        ip_address: '127.0.0.1',
        user_agent: 'Jest',
        session_hash: 'hash',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const session = await sessionsService.createSession(
        { username: 'alice' },
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(session.username).toBe('alice');
      expect(mockModel.create).toHaveBeenCalled();
      const callArgs = mockModel.create.mock.calls[0];
      expect(callArgs[0]).toBeDefined(); // 64-char token
      expect(callArgs[1]).toBe('alice');
      expect(callArgs[2]).toBe('127.0.0.1');
      expect(callArgs[3]).toBe('Mozilla/5.0');
    });
  });

  describe('getActiveSessions()', () => {
    it('returns active sessions filtered optionally by username', async () => {
      mockModel.findActive.mockResolvedValueOnce([
        { id: 1, username: 'alice', is_active: true } as any,
      ]);

      const result = await sessionsService.getActiveSessions('alice');
      expect(result).toHaveLength(1);
      expect(mockModel.findActive).toHaveBeenCalledWith('alice');
    });
  });

  describe('revokeSessionByToken()', () => {
    it('revokes session when token is found', async () => {
      mockModel.revokeByToken.mockResolvedValueOnce(true);

      const result = await sessionsService.revokeSessionByToken('valid_token');
      expect(result.success).toBe(true);
    });

    it('throws 404 AppError when token is not found or already revoked', async () => {
      mockModel.revokeByToken.mockResolvedValueOnce(false);

      await expect(sessionsService.revokeSessionByToken('invalid_token')).rejects.toThrow(AppError);
    });
  });

  describe('revokeSessionById()', () => {
    it('revokes session by numeric ID', async () => {
      mockModel.revokeById.mockResolvedValueOnce(true);

      const result = await sessionsService.revokeSessionById(12);
      expect(result.success).toBe(true);
    });

    it('throws 400 on invalid or non-numeric ID', async () => {
      await expect(sessionsService.revokeSessionById('abc')).rejects.toThrow('Invalid session ID');
      await expect(sessionsService.revokeSessionById(-5)).rejects.toThrow('Invalid session ID');
    });

    it('throws 404 when session ID not found', async () => {
      mockModel.revokeById.mockResolvedValueOnce(false);

      await expect(sessionsService.revokeSessionById(999)).rejects.toThrow('not found');
    });
  });
});
