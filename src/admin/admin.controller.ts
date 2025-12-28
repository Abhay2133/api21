import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ERROR_CODES } from '../constants';
import { exit } from 'node:process';

@Controller('admin')
export class AdminController {
  @Post('/kill')
  killServer(@Headers('x-admin-secret') secret: string) {
    if (secret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    setTimeout(() => {
      exit(ERROR_CODES.KILL_SERVER);
    });

    return {
      success: true,
      message: 'Server shutdown initiated',
      code: ERROR_CODES.KILL_SERVER,
    };
  }
}
