import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: any = {
      status: 'error',
      message: 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        responseBody = {
          status: 'error',
          message: res,
        };
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        // If validation error from ValidationPipe
        if (Array.isArray(obj.message)) {
          responseBody = {
            status: 'error',
            message: obj.message.join(', '),
            errors: obj.message,
          };
        } else {
          responseBody = {
            status: obj.status || 'error',
            ...obj,
          };
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error('Unhandled application exception:', exception.stack);
      responseBody = {
        status: 'error',
        message: exception.message || 'Internal Server Error',
      };
    }

    response.status(status).json(responseBody);
  }
}
