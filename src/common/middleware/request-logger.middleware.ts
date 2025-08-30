import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const logger = new Logger('RequestLogger');

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const safeHeaders = {
      authorization: !!req.headers.authorization,
      host: req.headers.host,
      'content-type': req.headers['content-type'],
    };
    logger.log(`→ ${req.method} ${req.originalUrl} | headers: ${JSON.stringify(safeHeaders)}`);

    // capture raw body size (if available)
    let chunksSize = 0;
    req.on('data', (chunk) => { chunksSize += chunk.length; });

    res.on('finish', () => {
      const ms = Date.now() - start;
      logger.log(`← ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms - bodyBytes:${chunksSize}`);
    });

    next();
  }
}
