import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

const logger = new Logger('AllExceptions');

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception instanceof HttpException ? exception.getResponse() : exception?.message || exception;

    logger.error(`Exception on ${req.method} ${req.originalUrl} — status ${status} — message: ${JSON.stringify(message)}`, exception?.stack);

    res.status(status).json({
      statusCode: status,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      error: typeof message === 'string' ? message : message,
    });
  }
}
