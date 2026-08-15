import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service.js';

export interface AuthenticatedRequest extends Request {
  session?: {
    id: number;
    token: string;
    username: string;
  };
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      const result = await this.databaseService.query(
        'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
        [token]
      );

      if (result.rows.length === 0) {
        throw new UnauthorizedException({
          status: 'error',
          message: 'Unauthorized or expired session',
        });
      }

      req.session = result.rows[0];
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({
        status: 'error',
        message: 'Failed to verify session',
      });
    }
  }
}
