// Lightweight access-log middleware. Times every request from arrival to the
// 'finish' event and colour-codes by status class (green/cyan/yellow/red).
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const start = Date.now();

    // 'finish' fires after the response body is fully flushed — that's when
    // the final status code and total duration are known.
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      // ANSI colours: 31=red (5xx), 33=yellow (4xx), 36=cyan (3xx), 32=green (2xx).
      const color =
        statusCode >= 500 ? '31' : statusCode >= 400 ? '33' : statusCode >= 300 ? '36' : '32';
      this.logger.log(
        `\x1b[${color}m${method} ${originalUrl} ${statusCode} ${duration}ms\x1b[0m - ${ip} ${userAgent}`,
      );
    });

    next();
  }
}
