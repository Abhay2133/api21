import { sessionsModel } from './sessions.model.js';

export class SessionsJob {
  static async cleanupExpiredSessions(): Promise<{ success: boolean; deletedCount: number }> {
    const deletedCount = await sessionsModel.cleanupOldSessions(30);
    console.log(`[SessionsJob] Cleaned up ${deletedCount} expired sessions older than 30 days.`);
    return {
      success: true,
      deletedCount,
    };
  }
}
