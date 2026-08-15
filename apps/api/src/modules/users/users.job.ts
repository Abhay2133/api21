export interface UserWelcomeJobPayload {
  userId: number;
  email: string;
  name: string;
}

export class UsersJob {
  static async handleWelcomeEmail(payload: UserWelcomeJobPayload): Promise<{ success: boolean; deliveredAt: string }> {
    console.log(`[UserJob] Processing welcome email for user #${payload.userId} (${payload.email})`);
    return {
      success: true,
      deliveredAt: new Date().toISOString(),
    };
  }
}
