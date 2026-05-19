import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const color =
        statusCode >= 500 ? '31' : statusCode >= 400 ? '33' : statusCode >= 300 ? '36' : '32';
      this.logger.log(
        `\x1b[${color}m${method} ${originalUrl} ${statusCode} ${duration}ms\x1b[0m - ${ip} ${userAgent}`,
      );
    });

    next();
  }
}
