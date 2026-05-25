// Relays gateway requests to the right service, streaming the response back
// unchanged so clients see the original status/headers/body.
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';

// Service name → base URL, defaulting to the dev localhost ports.
const SERVICE_MAP: Record<string, string> = {
  'user-service':        process.env.USER_SERVICE_URL        || 'http://localhost:3001',
  'event-service':       process.env.EVENT_SERVICE_URL       || 'http://localhost:3002',
  'registration-service':process.env.REGISTRATION_SERVICE_URL|| 'http://localhost:3003',
  'email-service':       process.env.EMAIL_SERVICE_URL       || 'http://localhost:3004',
  'checkin-service':     process.env.CHECKIN_SERVICE_URL     || 'http://localhost:3005',
  'notification-service':process.env.NOTIFICATION_SERVICE_URL|| 'http://localhost:3006',
  'analytics-service':   process.env.ANALYTICS_SERVICE_URL   || 'http://localhost:3007',
  'file-service':        process.env.FILE_SERVICE_URL        || 'http://localhost:3008',
  'task-service':        process.env.TASK_SERVICE_URL        || 'http://localhost:3009',
  'support-service':     process.env.SUPPORT_SERVICE_URL     || 'http://localhost:3010',
  'networking-service':  process.env.NETWORKING_SERVICE_URL  || 'http://localhost:3011',
};

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Forward an incoming request to a downstream service.
   *
   * @param overridePath Set when the public-facing URL differs from the
   *   downstream URL (e.g. `/public/events/:id` → `/events/:id/public`).
   */
  async forward(
    req: Request,
    res: Response,
    serviceName: string,
    overridePath?: string,
  ): Promise<void> {
    const baseUrl = SERVICE_MAP[serviceName];
    if (!baseUrl) {
      // Misconfiguration, not a client error — return 502 (Bad Gateway).
      res.status(502).json({ error: `Unknown service: ${serviceName}` });
      return;
    }

    const path = overridePath ?? req.path;
    const targetUrl = `${baseUrl}${path}${this.buildQuery(req.query)}`;
    this.logger.debug(`${req.method} ${req.path} → ${targetUrl}`);

    try {
      // `responseType: 'stream'` lets large payloads pass through without
      // buffering. `validateStatus: () => true` stops axios throwing on 4xx/5xx
      // — we want to relay every downstream status verbatim.
      const response = await this.http.axiosRef.request({
        method: req.method as any,
        url: targetUrl,
        data: req.body,
        headers: this.forwardHeaders(req),
        responseType: 'stream',
        validateStatus: () => true,
      });

      res.status(response.status);
      // Strip hop-by-hop headers — Express manages framing itself; copying
      // these from upstream confuses the response (chunked-vs-content-length).
      Object.entries(response.headers).forEach(([k, v]) => {
        if (!['transfer-encoding', 'connection'].includes(k.toLowerCase())) {
          res.setHeader(k, v as string);
        }
      });
      response.data.pipe(res);
    } catch (err: any) {
      // Network-level failure (DNS, ECONNREFUSED, timeout). Map to 502 so the
      // client knows the gateway is up but the dependency isn't.
      this.logger.error(`Proxy error → ${serviceName}: ${err.message}`);
      res.status(502).json({ error: 'Service temporarily unavailable', service: serviceName });
    }
  }

  private buildQuery(query: Record<string, any>): string {
    const params = new URLSearchParams(query as any).toString();
    return params ? `?${params}` : '';
  }

  // Selectively forward only the headers downstream needs: the bearer token
  // for re-validation/RBAC, and the trace ID for cross-service correlation.
  // Anything else (cookies, host, hop-by-hop) is dropped on purpose.
  private forwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (req.headers.authorization) {
      headers['authorization'] = req.headers.authorization;
    }
    if (req.headers['x-request-id']) {
      headers['x-request-id'] = req.headers['x-request-id'] as string;
    }
    return headers;
  }
}
