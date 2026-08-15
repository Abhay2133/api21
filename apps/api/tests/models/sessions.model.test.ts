import { SessionsModel } from '../../src/modules/sessions/sessions.model.js';
import { databaseService, DatabaseService } from '../../src/core/database/database.service.js';

describe('SessionsModel - Unit Tests', () => {
  let sessionsModel: SessionsModel;
  const mockQuery = jest.fn();

  beforeAll(() => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));
    sessionsModel = new SessionsModel();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('create inserts session record', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          token: 'token123',
          username: 'alice',
          ip_address: '127.0.0.1',
          user_agent: 'Jest',
          session_hash: 'hash',
          is_active: true,
        },
      ],
    });

    const session = await sessionsModel.create('token123', 'alice', '127.0.0.1', 'Jest', 'hash');
    expect(session.username).toBe('alice');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sessions'),
      ['token123', 'alice', '127.0.0.1', 'Jest', 'hash']
    );
  });

  it('findActive returns active sessions with optional username filter', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'alice', is_active: true }],
    });

    const sessions = await sessionsModel.findActive('alice');
    expect(sessions).toHaveLength(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE is_active = true AND username = $1'),
      ['alice']
    );
  });

  it('revokeByToken updates is_active = false', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const success = await sessionsModel.revokeByToken('tok_123');
    expect(success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sessions SET is_active = false'),
      ['tok_123']
    );
  });

  it('revokeById updates is_active = false by numeric ID', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const success = await sessionsModel.revokeById(5);
    expect(success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sessions SET is_active = false'),
      [5]
    );
  });
});
